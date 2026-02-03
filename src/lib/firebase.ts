// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsnK_DrlllP39iAwcoCKEEwTuoZ7B0R98",
  authDomain: "hotel-booking-frontend-109f7.firebaseapp.com",
  projectId: "hotel-booking-frontend-109f7",
  storageBucket: "hotel-booking-frontend-109f7.firebasestorage.app",
  messagingSenderId: "172477694587",
  appId: "1:172477694587:web:4583f538674c45817218de",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Firestore instance (REQUIRED by firestoreStorage.ts)
export const db = getFirestore(app);

// (optional default export — harmless if unused)
export default app;
