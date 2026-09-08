// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "multivexai.firebaseapp.com",
  projectId: "multivexai",
  storageBucket: "multivexai.firebasestorage.app",
  messagingSenderId: "107615983355",
  appId: "1:107615983355:web:f123ec5d40be25a578025e"
};

// Initialize Firebase (guard against re-init during HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
