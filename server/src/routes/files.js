/**
 * src/routes/files.js — File Management Routes
 *
 * All routes require auth + room membership.
 *
 * GET    /rooms/:id/files                        — list files
 * POST   /rooms/:id/files/create                 — create file
 * GET    /rooms/:id/files/:fileId                — get file content
 * POST   /rooms/:id/files/:fileId/update         — update file content
 * DELETE /rooms/:id/files/:fileId                — delete file
 * GET    /rooms/:id/files/:fileId/snapshots       — list snapshots
 * POST   /rooms/:id/files/:fileId/save           — manual snapshot
 * POST   /rooms/:id/files/:fileId/rollback       — rollback to snapshot
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRoomAccess } = require('../middleware/roomAccess');
const fs = require('../services/fileService');
const ss = require('../services/snapshotService');

const auth = [authenticate, requireRoomAccess];

// List all files in a room
router.get('/:id/files', ...auth, async (req, res, next) => {
    try {
        const files = await fs.listFiles(req.params.id);
        res.json(files);
    } catch (err) { next(err); }
});

// Create a file — only the room creator is allowed (enforced on frontend; backend double-checks)
router.post('/:id/files/create', ...auth, async (req, res, next) => {
    try {
        // Only creator can add files
        if (req.room.creatorEmail !== req.user.email) {
            return res.status(403).json({ error: 'Only the room creator can add files' });
        }
        const { filename, language = 'javascript', content = '' } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename is required' });
        const file = await fs.createFile(req.params.id, filename, language, content, req.user.email);
        res.status(201).json(file);
    } catch (err) { next(err); }
});

// Get a single file
router.get('/:id/files/:fileId', ...auth, async (req, res, next) => {
    try {
        const file = await fs.getFile(req.params.id, req.params.fileId);
        res.json(file);
    } catch (err) { next(err); }
});

// Update file content
router.post('/:id/files/:fileId/update', ...auth, async (req, res, next) => {
    try {
        const { content } = req.body;
        if (content === undefined) return res.status(400).json({ error: 'content is required' });
        const result = await fs.updateFile(req.params.id, req.params.fileId, content, req.user.email);
        res.json(result);
    } catch (err) { next(err); }
});

// Delete a file — creator only
router.delete('/:id/files/:fileId', ...auth, async (req, res, next) => {
    try {
        if (req.room.creatorEmail !== req.user.email) {
            return res.status(403).json({ error: 'Only the room creator can delete files' });
        }
        await fs.deleteFile(req.params.id, req.params.fileId);
        res.json({ success: true });
    } catch (err) { next(err); }
});

// List snapshots for a file
router.get('/:id/files/:fileId/snapshots', ...auth, async (req, res, next) => {
    try {
        const snapshots = await ss.listSnapshots(req.params.id, req.params.fileId);
        res.json(snapshots);
    } catch (err) { next(err); }
});

// Manually save a snapshot
router.post('/:id/files/:fileId/save', ...auth, async (req, res, next) => {
    try {
        const { commitMessage = 'manual save' } = req.body;
        const snap = await ss.saveSnapshot(req.params.id, req.params.fileId, req.user.email, commitMessage);
        res.status(201).json(snap);
    } catch (err) { next(err); }
});

// Rollback to a snapshot
router.post('/:id/files/:fileId/rollback', ...auth, async (req, res, next) => {
    try {
        const { snapshotId } = req.body;
        if (!snapshotId) return res.status(400).json({ error: 'snapshotId is required' });
        const result = await ss.rollbackToSnapshot(req.params.id, req.params.fileId, snapshotId, req.user.email);
        res.json(result);
    } catch (err) { next(err); }
});

module.exports = router;
