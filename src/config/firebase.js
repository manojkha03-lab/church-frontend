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
// Vite injects VITE_* env vars at build time.
// Set them in frontend/.env (local) AND Vercel Environment Variables (prod).
// Get the values from:
//   Firebase Console → Project Settings → General → Your apps → Web app → Config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Diagnostics — which keys are missing?
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
    // Guard against null (causes "Cannot read properties of null").
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
    '\nSet VITE_FIREBASE_* in .env (local) and Vercel env vars (production).',
  );
}

const isFirebaseConfigured = Boolean(auth);

// Human-readable status for UI diagnostics
const firebaseStatus = {
  configured: isFirebaseConfigured,
  missingKeys: missingFirebaseKeys,
  initError: firebaseInitError,
  get reason() {
    if (isFirebaseConfigured) return null;
    if (missingFirebaseKeys.length > 0) {
      return `Firebase environment variables not set: ${missingFirebaseKeys.join(', ')}. ` +
        'Admin must add VITE_FIREBASE_* values in the .env file and Vercel dashboard.';
    }
    if (firebaseInitError) {
      return `Firebase failed to initialize: ${firebaseInitError.message}`;
    }
    return 'Firebase auth is unavailable (unknown reason).';
  },
};

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
  firebaseStatus,
};
