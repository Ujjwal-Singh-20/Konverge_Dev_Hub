/**
 * src/routes/users.js — User Profile & LLM Token Routes
 *
 * POST /users/token  — Save (encrypted) LLM API token
 * GET  /users/me     — Get current user profile (no token in response)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { saveLlmToken, getUser, upsertUser } = require('../services/userService');

// GET /users/me
router.get('/me', authenticate, async (req, res, next) => {
    try {
        await upsertUser(req.user.uid, req.user.email, req.user.name);
        const user = await getUser(req.user.email);
        res.json(user);
    } catch (err) {
        next(err);
    }
});

// POST /users/token — store the user's LLM API key, encrypted at rest
router.post('/token', authenticate, async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'token is required' });
        // token is encrypted before being stored — never logged
        const result = await saveLlmToken(req.user.email, token);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
