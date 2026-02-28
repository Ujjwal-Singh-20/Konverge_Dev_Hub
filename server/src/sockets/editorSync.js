/**
 * src/sockets/editorSync.js — Real-time Editor Synchronisation
 *
 * Events:
 *   editor:join   (client → server) { roomId, fileId }
 *     → socket joins room channel `room:{roomId}:file:{fileId}`
 *
 *   editor:change (client → server) { roomId, fileId, delta, fullContent }
 *     → saves content to Firestore (debounced via lastSave tracking)
 *     → broadcasts delta to all other room participants
 *
 *   editor:cursor (client → server) { roomId, fileId, position }
 *     → broadcasts cursor position to other participants
 *
 *   editor:diff   (server → clients) { fileId, diff, suggestedCode, appliedBy }
 *     → broadcast when AI suggestion diff should be applied
 *
 * Each file channel is isolated: room:{roomId}:file:{fileId}
 */

const { getDb } = require('../config/firebase');

// Simple in-memory debounce map — roomId:fileId → timeout handle
const saveTimers = {};
const DEBOUNCE_MS = 1500;

function initEditorSync(io, socket) {

    // Join a file editing channel
    socket.on('editor:join', ({ roomId, fileId }) => {
        const channel = `room:${roomId}:file:${fileId}`;
        socket.join(channel);
        console.log(`[EDITOR] ${socket.user.email} joined channel ${channel}`);
    });

    // Receive a code change, broadcast it, and debounce-save to Firestore
    socket.on('editor:change', async ({ roomId, fileId, delta, fullContent }) => {
        if (!roomId || !fileId) return;

        const channel = `room:${roomId}:file:${fileId}`;

        // Broadcast the delta to all OTHER clients in the channel
        socket.to(channel).emit('editor:change', {
            delta,
            fullContent,
            senderEmail: socket.user.email,
            fileId,
        });

        // Debounced Firestore write — persists every DEBOUNCE_MS ms of inactivity
        const key = `${roomId}:${fileId}`;
        if (saveTimers[key]) clearTimeout(saveTimers[key]);

        saveTimers[key] = setTimeout(async () => {
            try {
                const db = getDb();
                const now = new Date().toISOString();
                await db.collection('rooms').doc(roomId)
                    .collection('files').doc(fileId)
                    .update({ content: fullContent, updatedAt: now });
            } catch (err) {
                console.error('[EDITOR] Firestore save failed:', err.message);
            }
        }, DEBOUNCE_MS);
    });

    // Cursor position broadcast — ephemeral, no DB save
    socket.on('editor:cursor', ({ roomId, fileId, position }) => {
        if (!roomId || !fileId) return;
        const channel = `room:${roomId}:file:${fileId}`;
        socket.to(channel).emit('editor:cursor', {
            position,
            senderEmail: socket.user.email,
            senderName: socket.user.name,
            fileId,
        });
    });

    // AI diff broadcast — called by the AI route after computing a diff
    // The route emits via io.to(); this handler is for client-triggered re-broadcasts
    socket.on('editor:applyDiff', ({ roomId, fileId, diff, suggestedCode }) => {
        const channel = `room:${roomId}:file:${fileId}`;
        io.to(channel).emit('editor:diff', {
            diff,
            suggestedCode,
            appliedBy: socket.user.email,
            fileId,
        });
    });
}

module.exports = initEditorSync;
