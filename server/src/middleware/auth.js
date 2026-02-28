/**
 * src/middleware/auth.js — Firebase ID Token Verification
 *
 * Reads the Authorization: Bearer <idToken> header, verifies it with
 * Firebase Admin SDK, and attaches req.user = { uid, email, name } to
 * the request. Returns 401 if the token is missing or invalid.
 */

const { admin } = require('../config/firebase');

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);

        // Attach verified user details to the request
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email,
        };

        next();
    } catch (err) {
        console.error('[AUTH] Token verification failed:', err.code);
        return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
    }
}

module.exports = { authenticate };
