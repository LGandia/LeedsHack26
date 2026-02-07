import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC49xk0IY6ER-NLetAgDu9Pk7cSsilKCPg",
  authDomain: "leedshack26.firebaseapp.com",
  projectId: "leedshack26",
  storageBucket: "leedshack26.firebasestorage.app",
  messagingSenderId: "314817464747",
  appId: "1:314817464747:web:d2940c5697afab3564aaee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);