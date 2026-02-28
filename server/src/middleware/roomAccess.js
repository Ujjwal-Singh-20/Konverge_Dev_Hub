/**
 * src/middleware/roomAccess.js — Room Access Control
 *
 * Fetches the room document from Firestore and confirms that req.user.email
 * is in the room's allowedEmails array. Returns 403 otherwise.
 *
 * Attaches req.room to the request for downstream handlers.
 */

const { getDb } = require('../config/firebase');

async function requireRoomAccess(req, res, next) {
    const roomId = req.params.id;
    if (!roomId) return res.status(400).json({ error: 'Missing room ID' });

    try {
        const db = getDb();
        const roomSnap = await db.collection('rooms').doc(roomId).get();

        if (!roomSnap.exists) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const room = { id: roomSnap.id, ...roomSnap.data() };

        // Check the requesting user's email against the allowed list
        if (!room.allowedEmails || !room.allowedEmails.includes(req.user.email)) {
            return res.status(403).json({ error: 'You are not authorised to access this room' });
        }

        req.room = room; // Make room data available downstream
        next();
    } catch (err) {
        console.error('[ROOM ACCESS]', err.message);
        next(err);
    }
}

module.exports = { requireRoomAccess };
