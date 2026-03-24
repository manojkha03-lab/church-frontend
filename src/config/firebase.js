import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

// ── Firebase config from env vars (all optional) ────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth = null;
let googleProvider = null;

// Only initialize if ALL keys are present — otherwise Firebase is simply off
const allKeysPresent = Object.values(firebaseConfig).every(Boolean);

if (allKeysPresent) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    if (auth && !auth.settings) auth.settings = {};
    googleProvider = new GoogleAuthProvider();
  } catch {
    // Firebase init failed — app continues without it
    auth = null;
    googleProvider = null;
  }
}

// true when Firebase SDK initialized successfully
const isFirebaseAvailable = Boolean(auth);

export {
  auth,
  googleProvider,
  isFirebaseAvailable,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
};

