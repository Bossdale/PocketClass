// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVzSEHGo_krtz3niYwrA41RrbmWYaQDC8",
  authDomain: "edulinked-7aaea.firebaseapp.com",
  projectId: "edulinked-7aaea",
  storageBucket: "edulinked-7aaea.firebasestorage.app",
  messagingSenderId: "559806283647",
  appId: "1:559806283647:web:bc2700a30640e0896d244a",
  measurementId: "G-SV9E5ZP32Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);