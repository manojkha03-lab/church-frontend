import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

// ── Firebase client config ──────────────────────────────────────────────────
// Values come from environment variables (Vite injects VITE_* at build time).
// Set these in frontend/.env for local dev AND in Vercel Environment Variables
// for production.  Get the values from:
//   Firebase Console → Project Settings → General → Your apps → Web app → Config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check which keys are missing (empty / undefined)
const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

let app = null;
let auth = null;
let googleProvider = null;
let firebaseInitError = null;

if (missingFirebaseKeys.length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Firebase SDK internally accesses auth.settings for RecaptchaVerifier.
    // Guard against it being null (causes "Cannot read properties of null").
    if (auth && !auth.settings) {
      auth.settings = {};
    }
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    firebaseInitError = error;
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn(
    'Firebase config incomplete — missing:',
    missingFirebaseKeys.join(', '),
    '\nPhone OTP, Google sign-in, and email sign-in are disabled.',
  );
}

const isFirebaseConfigured = Boolean(auth);

export {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  googleProvider,
  isFirebaseConfigured,
  missingFirebaseKeys,
  firebaseInitError,
};
