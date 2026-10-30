function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  mongodbUri: requiredEnv('MONGODB_URI'),
  mongodbDbName: process.env.MONGODB_DB_NAME ?? 'openaltmarket',
  firebaseProjectId: requiredEnv('FIREBASE_PROJECT_ID'),
  firebaseClientEmail: requiredEnv('FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  superAdminEmails: (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
};