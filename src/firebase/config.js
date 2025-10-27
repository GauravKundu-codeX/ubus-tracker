import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace this with your own config object from Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAp1cyuNWpxnpp9VOfmcY2paqKw7J1ol5M",
  authDomain: "bus-tracker-2638e.firebaseapp.com",
  projectId: "bus-tracker-2638e",
  storageBucket: "bus-tracker-2638e.firebasestorage.app",
  messagingSenderId: "576899684535",
  appId: "1:576899684535:web:da761d8b162d8a95d8d532",
  measurementId: "G-5E1ZZE7XN2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll need
export const auth = getAuth(app);
export const db = getFirestore(app);





