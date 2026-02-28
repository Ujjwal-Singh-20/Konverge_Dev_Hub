/**
 * src/services/userService.js — User Profile & LLM Token Management
 *
 * User documents live at: users/{email}
 *
 * LLM tokens from users are AES-encrypted before storage using the
 * ENCRYPTION_SECRET env var. Tokens are NEVER logged.
 */

const CryptoJS = require('crypto-js');
const { getDb } = require('../config/firebase');

const SECRET = process.env.ENCRYPTION_SECRET || 'fallback-dev-secret-key-12345';
if (SECRET === 'fallback-dev-secret-key-12345') {
    console.warn('[WARN] ENCRYPTION_SECRET not set — using dev fallback key. Tokens are NOT securely encrypted.');
}

function encrypt(plaintext) {
    return CryptoJS.AES.encrypt(plaintext, SECRET).toString();
}

function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Upsert a user profile in Firestore.
 * Called on first login / after auth middleware resolves.
 */
async function upsertUser(uid, email, displayName) {
    const db = getDb();
    const ref = db.collection('users').doc(email);
    const snap = await ref.get();

    if (!snap.exists) {
        await ref.set({ uid, email, displayName: displayName || email || 'Unknown', createdAt: new Date().toISOString() });
    }
    return { email, displayName };
}

/**
 * Store an encrypted LLM API token for a user.
 * The raw token is never stored or logged.
 */
async function saveLlmToken(email, rawToken) {
    const db = getDb();
    const encrypted = encrypt(rawToken); // AES-256 encrypted
    await db.collection('users').doc(email).set(
        { encryptedLlmToken: encrypted, tokenUpdatedAt: new Date().toISOString() },
        { merge: true }
    );
    return { success: true };
}

/**
 * Retrieve and decrypt the user's LLM token.
 * Returns null if not set.
 */
async function getLlmToken(email) {
    const db = getDb();
    const snap = await db.collection('users').doc(email).get();
    if (!snap.exists || !snap.data().encryptedLlmToken) return null;
    return decrypt(snap.data().encryptedLlmToken);
}

/**
 * Get user profile (without the encrypted token field).
 */
async function getUser(email) {
    const db = getDb();
    const snap = await db.collection('users').doc(email).get();
    if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
    const { encryptedLlmToken, ...safeData } = snap.data();
    return safeData;
}

module.exports = { upsertUser, saveLlmToken, getLlmToken, getUser };
