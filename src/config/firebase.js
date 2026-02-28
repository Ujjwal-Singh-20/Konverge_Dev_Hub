import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyDITLoabHj_ew-8DxRIQIfKF_boDDCepXE",
    authDomain: "konverge-ps3.firebaseapp.com",
    projectId: "konverge-ps3",
    storageBucket: "konverge-ps3.firebasestorage.app",
    messagingSenderId: "60087008504",
    appId: "1:60087008504:web:5962357345b7edff55cf0d",
    measurementId: "G-53RFJMS7EZ"
};

let app, auth;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase config is missing or invalid. Please update src/config/firebase.js");
}

export const googleProvider = new GoogleAuthProvider();
export { auth };
