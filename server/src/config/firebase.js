/**
 * src/config/firebase.js — Firebase Admin SDK Initialisation
 *
 * Initialises the Firebase Admin SDK once using credentials from environment
 * variables. Exports:
 *   - admin      : the firebase-admin namespace (for auth + other services)
 *   - db         : the Firestore database instance
 *   - initFirebase(): call once at startup
 */

const admin = require('firebase-admin');
const serviceAccount = require("../../../konverge-ps3-firebase-adminsdk-fbsvc-57123c91f6.json");


let db = null;

function initFirebase() {
    if (admin.apps.length > 0) return; // Already initialised

    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialised — Firestore ready');
}

function getDb() {
    if (!db) throw new Error('Firestore not initialised. Call initFirebase() first.');
    return db;
}

module.exports = { admin, getDb, initFirebase };
