import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

const API_BASE = 'https://konverge-dev-hub.onrender.com';

export const ChatProvider = ({ children }) => {
    // ── Auth state ──────────────────────────────────────────────────────────
    const [currentUser, setCurrentUser] = useState(null); // { uid, email, name, idToken }

    // ── Room state ──────────────────────────────────────────────────────────
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null); // full room object

    // ── Chat state ──────────────────────────────────────────────────────────
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // ── Editor / file state ─────────────────────────────────────────────────
    const [files, setFiles] = useState([]);               // all files in room
    const [activeFile, setActiveFile] = useState(null);   // currently open file

    // ── Theme ───────────────────────────────────────────────────────────────
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // ── AI state ────────────────────────────────────────────────────────────
    const [aiResponses, setAiResponses] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestedCode, setAiSuggestedCode] = useState(null);

    const socketRef = useRef(null); // Socket.IO connection — set by App after auth

    // ── Helpers ─────────────────────────────────────────────────────────────
    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser?.idToken}`,
    }), [currentUser]);

    // ── Theme ───────────────────────────────────────────────────────────────
    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', next === 'dark');
            localStorage.setItem('theme', next);
            return next;
        });
    };

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // ── Room CRUD ───────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/rooms/list`, { headers: authHeaders() });
            const data = await res.json();
            setRooms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[fetchRooms]', err);
        }
    }, [currentUser, authHeaders]);

    const createOrJoinRoom = useCallback(async (name, allowedEmails = []) => {
        if (!currentUser) return;
        // Try to find existing room by name first
        const existing = rooms.find(r => r.name === name);
        if (existing) {
            await joinRoom(existing.id);
            return;
        }
        // Create if not found
        const res = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, allowedEmails }),
        });
        const room = await res.json();
        if (!res.ok) throw new Error(room.error || 'Failed to create room');
        setRooms(prev => [room, ...prev]);
        selectRoom(room);
    }, [currentUser, rooms, authHeaders]);

    const joinRoom = useCallback(async (roomId) => {
        const res = await fetch(`${API_BASE}/rooms/join`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ roomId }),
        });
        const room = await res.json();
        if (!res.ok) throw new Error(room.error || 'Failed to join room');
        selectRoom(room);
    }, [authHeaders]);

    const selectRoom = useCallback((room) => {
        setCurrentRoom(room);
        setMessages([]);
        setFiles([]);
        setActiveFile(null);
    }, []);

    // ── Message History ─────────────────────────────────────────────────────
    const fetchMessages = useCallback(async () => {
        if (!currentRoom) return;
        const res = await fetch(`${API_BASE}/rooms/${currentRoom.id}/messages`, {
            headers: authHeaders(),
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
    }, [currentRoom, authHeaders]);

    // Send message via Socket.IO
    const sendMessage = useCallback((text) => {
        if (!socketRef.current || !currentRoom || !text.trim()) return;
        socketRef.current.emit('chat:message', { roomId: currentRoom.id, text });
    }, [currentRoom]);

    // ── WebSocket Listners ──────────────────────────────────────────────────
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || !currentRoom) return;

        // Join room's chat channel for real-time messages
        socket.emit('chat:join', { roomId: currentRoom.id });

        const onChatMessage = (message) => {
            setMessages((prev) => {
                // Prevent duplicate messages if already in list
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        };

        socket.on('chat:message', onChatMessage);
        return () => {
            socket.off('chat:message', onChatMessage);
        };
    }, [socketRef, currentRoom?.id]);

    // ── File Management ─────────────────────────────────────────────────────
    const fetchFiles = useCallback(async () => {
        if (!currentRoom) return;
        const res = await fetch(`${API_BASE}/rooms/${currentRoom.id}/files`, {
            headers: authHeaders(),
        });
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
    }, [currentRoom, authHeaders]);

    const createFile = useCallback(async (filename, language = 'javascript', content = '') => {
        if (!currentRoom) return;
        const res = await fetch(`${API_BASE}/rooms/${currentRoom.id}/files/create`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ filename, language, content }),
        });
        const file = await res.json();
        if (!res.ok) throw new Error(file.error || 'Failed to create file');
        setFiles(prev => [...prev, file]);
        setActiveFile(file);
        return file;
    }, [currentRoom, authHeaders]);

    const updateFileContent = useCallback(async (fileId, content) => {
        if (!currentRoom) return;
        // Optimistic UI update so diffs apply instantly
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
        setActiveFile(prev => prev?.id === fileId ? { ...prev, content } : prev);

        try {
            await fetch(`${API_BASE}/rooms/${currentRoom.id}/files/${fileId}/update`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ content }),
            });
        } catch (err) {
            console.error('Failed to sync file content update:', err);
        }
    }, [currentRoom, authHeaders]);

    const deleteFile = useCallback(async (fileId) => {
        if (!currentRoom) return;
        await fetch(`${API_BASE}/rooms/${currentRoom.id}/files/${fileId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        setFiles(prev => prev.filter(f => f.id !== fileId));
        if (activeFile?.id === fileId) setActiveFile(files[0] || null);
    }, [currentRoom, activeFile, files, authHeaders]);

    // ── AI ──────────────────────────────────────────────────────────────────
    const askAi = useCallback(async (question) => {
        if (!currentRoom || !activeFile) return;
        setIsAiLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ai/query`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    roomId: currentRoom.id,
                    fileId: activeFile.id,
                    question,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAiResponses(prev => [{
                id: Date.now(),
                query: question,
                answer: data.answer,
                code: data.code,
                diff: data.diff,
                type: data.type,
                timestamp: new Date().toLocaleTimeString(),
            }, ...prev]);
        } catch (err) {
            console.error('[askAi]', err);
            setAiResponses(prev => [{
                id: Date.now(),
                query: question,
                answer: `Error: ${err.message}`,
                timestamp: new Date().toLocaleTimeString(),
            }, ...prev]);
        } finally {
            setIsAiLoading(false);
        }
    }, [currentRoom, activeFile, authHeaders]);

    const saveToken = useCallback(async (token) => {
        const res = await fetch(`${API_BASE}/users/token`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save token');
        return data;
    }, [authHeaders]);

    // ── Effects ─────────────────────────────────────────────────────────────
    useEffect(() => { fetchRooms(); }, [fetchRooms]);
    useEffect(() => { fetchMessages(); fetchFiles(); }, [currentRoom]);

    const value = {
        // Auth
        currentUser, setCurrentUser,
        // Rooms
        rooms, currentRoom, setCurrentRoom: selectRoom, createOrJoinRoom, joinRoom, fetchRooms,
        // Chat
        messages, setMessages, typingUsers, setTypingUsers, sendMessage, fetchMessages,
        // Files
        files, activeFile, setActiveFile, createFile, updateFileContent, deleteFile, fetchFiles,
        // AI
        aiResponses, isAiLoading, askAi, saveToken, aiSuggestedCode, setAiSuggestedCode,
        // Theme
        theme, toggleTheme,
        // Socket ref (set from outside after connection)
        socketRef,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
