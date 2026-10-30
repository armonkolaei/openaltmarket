const fs = require('node:fs');
const { MongoClient } = require('mongodb');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function parseEnv(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    });

  return Object.fromEntries(entries);
}

async function main() {
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    throw new Error('Usage: node scripts/promote-super-admin.cjs <email>');
  }

  const env = parseEnv('.env');
  const mongoUri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB_NAME || 'openaltmarket';
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (env.FIREBASE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n');

  if (!mongoUri || !projectId || !clientEmail || !privateKey) {
    throw new Error('Missing env values. Ensure .env contains MongoDB URI and Firebase admin credentials.');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  }

  const auth = getAuth();
  const firebaseUser = await auth.getUserByEmail(targetEmail);

  const client = new MongoClient(mongoUri);
  await client.connect();

  const users = client.db(dbName).collection('users');
  const now = new Date();

  await users.updateOne(
    { uid: firebaseUser.uid },
    {
      $set: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || targetEmail,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'super-admin',
        photoURL: firebaseUser.photoURL || null,
        role: 'super_admin',
        lastLoginAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  const updated = await users.findOne({ uid: firebaseUser.uid });
  await client.close();

  console.log('SUPER_ADMIN_UPSERTED');
  console.log(JSON.stringify({ email: updated?.email, uid: updated?.uid, role: updated?.role }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
