import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDsnK_DrlllP39iAwcoCKEEwTuoZ7B0R98",
  authDomain: "hotel-booking-frontend-109f7.firebaseapp.com",
  projectId: "hotel-booking-frontend-109f7",

  // ✅ FIXED — MUST be appspot.com
  storageBucket: "hotel-booking-frontend-109f7.appspot.com",

  messagingSenderId: "172477694587",
  appId: "1:172477694587:web:4583f538674c45817218de",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
