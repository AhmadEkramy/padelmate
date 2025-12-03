// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmos0Z06KWU7WpOJwW_8Cm3pDzBH6jKwQ",
  authDomain: "padel-mate-f188a.firebaseapp.com",
  projectId: "padel-mate-f188a",
  storageBucket: "padel-mate-f188a.firebasestorage.app",
  messagingSenderId: "440246533198",
  appId: "1:440246533198:web:d9bbec1fb2b3aa27b0d71f",
  measurementId: "G-H69SWK18FZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };

