import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Hash, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Create/Join Room Modal ────────────────────────────────────────────────────
const RoomModal = ({ onClose }) => {
    const { createOrJoinRoom, joinRoom } = useChat();
    const [mode, setMode] = useState('create'); // 'create' | 'join'
    const [name, setName] = useState('');
    const [emails, setEmails] = useState('');
    const [joinId, setJoinId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            if (mode === 'create') {
                if (!name.trim()) throw new Error('Room name is required');
                const allowedEmails = emails.split(',').map(e => e.trim()).filter(Boolean);
                await createOrJoinRoom(name.trim(), allowedEmails);
            } else {
                if (!joinId.trim()) throw new Error('Room ID is required');
                await joinRoom(joinId.trim());
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white dark:bg-chat-sidebar border dark:border-white/10 border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-5 border-b dark:border-white/5 border-gray-100">
                    <div className="flex gap-4">
                        <button
                            className={`text-sm font-bold ${mode === 'create' ? 'text-brand-primary' : 'text-gray-400'}`}
                            onClick={() => setMode('create')}
                        >
                            Create Room
                        </button>
                        <button
                            className={`text-sm font-bold ${mode === 'join' ? 'text-brand-primary' : 'text-gray-400'}`}
                            onClick={() => setMode('join')}
                        >
                            Join Room
                        </button>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                        <X size={15} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {mode === 'create' ? (
                        <>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Room Name</label>
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    placeholder="e.g. Frontend"
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-white/10 border-gray-200 bg-gray-50 dark:bg-white/5 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-primary/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Allowed Emails <span className="font-normal normal-case opacity-60">(comma separated)</span></label>
                                <input
                                    value={emails}
                                    onChange={e => setEmails(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    placeholder="alice@example.com, bob@example.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-white/10 border-gray-200 bg-gray-50 dark:bg-white/5 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-primary/30 transition-all"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Room ID</label>
                            <input
                                autoFocus
                                value={joinId}
                                onChange={e => setJoinId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="Paste Room ID here..."
                                className="w-full px-3.5 py-2.5 rounded-xl border dark:border-white/10 border-gray-200 bg-gray-50 dark:bg-white/5 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-primary/30 transition-all font-mono"
                            />
                        </div>
                    )}
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                </div>
                <div className="flex gap-3 p-5 pt-0">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border dark:border-white/10 border-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Working…' : mode === 'create' ? 'Create' : 'Join'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Room List ─────────────────────────────────────────────────────────────────
const RoomList = () => {
    const { rooms, currentRoom, setCurrentRoom, createOrJoinRoom } = useChat();
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Rooms</h2>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(true)}
                    className="p-1.5 hover:bg-brand-primary/10 text-gray-400 hover:text-brand-primary rounded-lg transition-all"
                    title="Create / Join Room"
                >
                    <Plus size={16} />
                </motion.button>
            </div>

            <nav className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1">
                {rooms.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-1">No rooms yet. Create one!</p>
                )}
                {rooms.map((room, index) => (
                    <motion.button
                        key={room.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentRoom(room)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 group
                            ${currentRoom?.id === room.id
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
                        `}
                    >
                        <Hash
                            size={18}
                            className={`transition-colors ${currentRoom?.id === room.id ? 'text-white' : 'text-gray-500 group-hover:text-brand-primary'}`}
                        />
                        <span className="flex-1 text-left truncate">{room.name}</span>
                        {currentRoom?.id === room.id && (
                            <motion.div layoutId="activeRoom" className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                    </motion.button>
                ))}
            </nav>

            <AnimatePresence>
                {showModal && (
                    <RoomModal
                        onClose={() => setShowModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomList;
