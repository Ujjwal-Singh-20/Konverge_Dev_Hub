require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initFirebase } = require('./src/config/firebase');
const roomsRouter = require('./src/routes/rooms');
const messagesRouter = require('./src/routes/messages');
const filesRouter = require('./src/routes/files');
const usersRouter = require('./src/routes/users');
const aiRouter = require('./src/routes/ai');
const initSockets = require('./src/sockets');

// ─── Initialise Firebase Admin SDK ────────────────────────────────────────────
initFirebase();

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: [
            process.env.CLIENT_ORIGIN || 'http://localhost:5173',
            'https://konvergedevhubbackenddeploy.vercel.app',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

initSockets(io);

// ─── Express Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: [
        process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        'https://konvergedevhubbackenddeploy.vercel.app',
    ],
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/rooms', roomsRouter);
app.use('/rooms', messagesRouter);
app.use('/rooms', filesRouter);
app.use('/users', usersRouter);
app.use('/ai', aiRouter);

// ─── 404 Fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🚀 Konverge Server running on http://localhost:${PORT}`);
    console.log(`   Socket.IO ready | Firebase connected\n`);
});
