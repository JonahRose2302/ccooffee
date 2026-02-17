// Firebase Configuration for ccooffee.de
// Initialized with Firebase SDK v10 (modular)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuWqfouQuNTlWIH_fpY0GxN0CjX9B3zkY",
    authDomain: "ccooffee.firebaseapp.com",
    projectId: "ccooffee",
    storageBucket: "ccooffee.firebasestorage.app",
    messagingSenderId: "306511091833",
    appId: "1:306511091833:web:caf20afdb33aa0e52cdca8",
    measurementId: "G-90T2G1KQ3H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully');
