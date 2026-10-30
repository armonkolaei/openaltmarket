import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  type Auth,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseClientConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseClientConfig) {
  const existingApp = getApps()[0];
  app = existingApp ?? initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  setPersistence(auth, browserLocalPersistence).catch((error: unknown) => {
    console.warn('Unable to set Firebase auth persistence.', error);
  });
} else {
  console.warn('Firebase client config is missing. Auth features are disabled until env vars are set.');
}

export { app, auth, googleProvider, hasFirebaseClientConfig };