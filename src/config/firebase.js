// Firebase is disabled in this project. These exports are no-op stubs kept only
// for backward compatibility with existing imports.
const auth = null;
const googleProvider = null;
const isFirebaseAvailable = false;

const disabled = async () => {
  throw new Error("Firebase is disabled");
};

const RecaptchaVerifier = function DisabledRecaptchaVerifier() {
  throw new Error("Firebase is disabled");
};

const signInWithPhoneNumber = disabled;
const signInWithPopup = disabled;

export {
  auth,
  googleProvider,
  isFirebaseAvailable,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
};

