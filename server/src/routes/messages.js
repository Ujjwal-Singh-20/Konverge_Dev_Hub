/**
 * src/routes/messages.js — Chat Message History
 *
 * GET  /rooms/:id/messages  — Fetch paginated message history for a room
 * POST /rooms/:id/messages  — Save a message (also handled via Socket.IO, but REST fallback here)
 *
 * Messages are stored in Firestore subcollection: rooms/{id}/messages
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRoomAccess } = require('../middleware/roomAccess');
const { getDb } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// GET /rooms/:id/messages?limit=50&before=<timestamp>
router.get('/:id/messages', authenticate, requireRoomAccess, async (req, res, next) => {
    try {
        const db = getDb();
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        let query = db.collection('rooms').doc(req.params.id)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        if (req.query.before) {
            query = query.startAfter(req.query.before);
        }

        const snap = await query.get();
        const messages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
        res.json(messages);
    } catch (err) {
        next(err);
    }
});

// POST /rooms/:id/messages — REST fallback (primary path is Socket.IO)
router.post('/:id/messages', authenticate, requireRoomAccess, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'text is required' });

        const db = getDb();
        const msgId = uuidv4();
        const msgData = {
            senderEmail: req.user.email,
            senderName: req.user.name,
            text,
            timestamp: new Date().toISOString(),
        };

        await db.collection('rooms').doc(req.params.id)
            .collection('messages').doc(msgId).set(msgData);

        res.status(201).json({ id: msgId, ...msgData });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
