/**
 * src/routes/ai.js — AI Assistant Route
 *
 * POST /ai/query
 *
 * Body: { roomId, fileId, question }
 *
 * Returns: { answer, code, diff }
 *   - answer : plain-text explanation from the LLM
 *   - code   : suggested replacement code (if any)
 *   - diff   : unified diff patch (if code suggestion exists)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRoomAccess } = require('../middleware/roomAccess');
const { queryAi } = require('../services/aiService');
const { getDb } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// POST /ai/query
router.post('/query', authenticate, async (req, res, next) => {
    try {
        const { roomId, fileId, question } = req.body;
        if (!roomId || !fileId || !question) {
            return res.status(400).json({ error: 'roomId, fileId, and question are required' });
        }

        // Check room access inline (we don't have :id param here)
        const db = getDb();
        const roomSnap = await db.collection('rooms').doc(roomId).get();
        if (!roomSnap.exists) return res.status(404).json({ error: 'Room not found' });
        const room = roomSnap.data();
        if (!room.allowedEmails.includes(req.user.email)) {
            return res.status(403).json({ error: 'Not authorised for this room' });
        }

        // Run AI query (fetches code context internally)
        const result = await queryAi(req.user.email, roomId, fileId, question);

        // Persist the AI interaction to Firestore (rooms/{id}/aiHistory/{id})
        const histId = uuidv4();
        await db.collection('rooms').doc(roomId).collection('aiHistory').doc(histId).set({
            fileId,
            question,
            answer: result.answer,
            code: result.code || null,
            diff: result.diff || null,
            askedBy: req.user.email,
            timestamp: new Date().toISOString(),
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
