import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let app = null;
let auth = null;
let googleProvider = null;
let firebaseInitError = null;

if (missingFirebaseKeys.length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Ensure auth.settings exists (Firebase SDK reads this internally for
    // RecaptchaVerifier — if the object is incomplete it throws
    // "Cannot read properties of null (reading 'settings')").
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
    `Firebase env is incomplete. Missing keys: ${missingFirebaseKeys.join(', ')}`
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
