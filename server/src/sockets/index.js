/**
 * src/sockets/index.js — Socket.IO Bootstrap
 *
 * Applies Firebase token verification to every socket connection.
 * Then delegates to editor and chat handlers per room.
 */

const { admin } = require('../config/firebase');
const initEditorSync = require('./editorSync');
const initChatSync = require('./chatSync');

function initSockets(io) {
    // ─── Socket Auth Middleware ──────────────────────────────────────────────
    // The frontend must pass the Firebase ID token in the handshake auth object:
    //   socket = io(URL, { auth: { token: firebaseIdToken } })
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));

        try {
            const decoded = await admin.auth().verifyIdToken(token);
            socket.user = { uid: decoded.uid, email: decoded.email, name: decoded.name || decoded.email };
            next();
        } catch {
            next(new Error('Invalid Firebase token'));
        }
    });

    // ─── Connection Handler ───────────────────────────────────────────────────
    io.on('connection', (socket) => {
        console.log(`[SOCKET] Connected: ${socket.user.email} (${socket.id})`);

        initEditorSync(io, socket);
        initChatSync(io, socket);

        socket.on('disconnect', () => {
            console.log(`[SOCKET] Disconnected: ${socket.user.email} (${socket.id})`);
        });
    });
}

module.exports = initSockets;
