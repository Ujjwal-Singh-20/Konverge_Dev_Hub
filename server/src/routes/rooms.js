/**
 * src/routes/rooms.js — Room Management Routes
 *
 * POST /rooms/create  — Create a new room
 * POST /rooms/join    — Join an existing room
 * GET  /rooms/list    — List rooms the current user can access
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createRoom, joinRoom, listRooms } = require('../services/roomService');
const { upsertUser } = require('../services/userService');

// POST /rooms/create
router.post('/create', authenticate, async (req, res, next) => {
    try {
        const { name, allowedEmails = [] } = req.body;
        if (!name) return res.status(400).json({ error: 'Room name is required' });

        // Ensure user profile exists in Firestore
        await upsertUser(req.user.uid, req.user.email, req.user.name);

        const room = await createRoom(name, req.user.email, allowedEmails);
        res.status(201).json(room);
    } catch (err) {
        next(err);
    }
});

// POST /rooms/join
router.post('/join', authenticate, async (req, res, next) => {
    try {
        const { roomId } = req.body;
        if (!roomId) return res.status(400).json({ error: 'roomId is required' });

        await upsertUser(req.user.uid, req.user.email, req.user.name);
        const room = await joinRoom(roomId, req.user.email);
        res.json(room);
    } catch (err) {
        next(err);
    }
});

// GET /rooms/list
router.get('/list', authenticate, async (req, res, next) => {
    try {
        const rooms = await listRooms(req.user.email);
        res.json(rooms);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
