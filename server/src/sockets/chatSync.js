/**
 * src/sockets/chatSync.js — Real-time Chat Synchronisation
 *
 * Events:
 *   chat:join     (client → server) { roomId }
 *     → socket joins room channel `room:{roomId}:chat`
 *
 *   chat:message  (client → server) { roomId, text }
 *     → saves message to Firestore: rooms/{roomId}/messages
 *     → broadcasts to all in the chat channel
 *
 *   chat:typing   (client → server) { roomId, isTyping }
 *     → ephemeral broadcast — no DB save
 */

const { getDb } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

function initChatSync(io, socket) {

    // Join a room's chat channel
    socket.on('chat:join', ({ roomId }) => {
        if (!roomId) return;
        const channel = `room:${roomId}:chat`;
        socket.join(channel);
        console.log(`[CHAT] ${socket.user.email} joined ${channel}`);
    });

    // Send a message — persist to Firestore + broadcast
    socket.on('chat:message', async ({ roomId, text }) => {
        if (!roomId || !text?.trim()) return;

        const channel = `room:${roomId}:chat`;
        const msgId = uuidv4();
        const msgData = {
            senderEmail: socket.user.email,
            senderName: socket.user.name,
            text: text.trim(),
            timestamp: new Date().toISOString(),
        };

        try {
            // Persist to Firestore
            const db = getDb();
            await db.collection('rooms').doc(roomId)
                .collection('messages').doc(msgId).set(msgData);

            // Broadcast to everyone in the channel (including sender — for multi-tab)
            io.to(channel).emit('chat:message', { id: msgId, ...msgData });
        } catch (err) {
            console.error('[CHAT] Failed to save message:', err.message);
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator — ephemeral, no DB save
    socket.on('chat:typing', ({ roomId, isTyping }) => {
        if (!roomId) return;
        const channel = `room:${roomId}:chat`;
        socket.to(channel).emit('chat:typing', {
            isTyping,
            senderEmail: socket.user.email,
            senderName: socket.user.name,
        });
    });
}

module.exports = initChatSync;
