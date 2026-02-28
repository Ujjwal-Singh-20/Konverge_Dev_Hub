import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import CodeEditor from './CodeEditor';
import PresenceAvatars from './PresenceAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomProvider } from '../../liveblocks.config';
import {
    Code2, Plus, X, FileCode, Shield, ChevronDown,
    Save, RotateCcw, Trash2
} from 'lucide-react';

// ─── Add File Modal ────────────────────────────────────────────────────────────
const AddFileModal = ({ onClose, onCreate }) => {
    const [filename, setFilename] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const LANGUAGES = [
        { id: 'javascript', label: 'JavaScript' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'python', label: 'Python' },
        { id: 'html', label: 'HTML' },
        { id: 'css', label: 'CSS' },
        { id: 'json', label: 'JSON' },
        { id: 'markdown', label: 'Markdown' },
        { id: 'rust', label: 'Rust' },
        { id: 'go', label: 'Go' },
        { id: 'cpp', label: 'C++' },
    ];

    const handleCreate = async () => {
        if (!filename.trim()) { setError('Filename is required'); return; }
        setLoading(true);
        try {
            await onCreate(filename.trim(), language);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create file');
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
                className="w-full max-w-md bg-white dark:bg-chat-sidebar border dark:border-white/10 border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-white/5 border-gray-100">
                    <div className="flex items-center gap-2">
                        <FileCode size={18} className="text-brand-primary" />
                        <h3 className="font-bold text-sm">Add New File</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Filename */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                            Filename
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={filename}
                            onChange={e => { setFilename(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="e.g. utils.js"
                            className="w-full px-4 py-2.5 rounded-xl border dark:border-white/10 border-gray-200
                                       bg-gray-50 dark:bg-white/5 text-sm font-medium
                                       focus:outline-none focus:ring-2 ring-brand-primary/30 transition-all"
                        />
                    </div>

                    {/* Language */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                            Language
                        </label>
                        <div className="relative">
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border dark:border-white/10 border-gray-200
                                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium appearance-none
                                           focus:outline-none focus:ring-2 ring-brand-primary/30 transition-all cursor-pointer"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.id} value={l.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{l.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border dark:border-white/10 border-gray-200 text-sm font-bold
                                   hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold
                                   shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Creating…' : 'Create File'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CollaborativeEditor = ({ theme }) => {
    const { currentRoom, files, activeFile, setActiveFile, createFile, deleteFile } = useChat();
    const [showAddModal, setShowAddModal] = useState(false);

    // Only the room creator can add / delete files
    const isCreator = currentRoom?.creatorEmail === useChat().currentUser?.email;

    const handleCreateFile = async (filename, language) => {
        await createFile(filename, language, '');
    };

    if (!currentRoom) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-chat-bg">
                <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                    <Code2 size={24} />
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">No Room Selected</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                    Please join or create a room in the Chat Hub first to start collaborating on code.
                </p>
            </div>
        );
    }

    return (
        <RoomProvider id={currentRoom.id} initialPresence={{ cursor: null }}>
            <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-chat-bg relative overflow-hidden">
                {/* ── Editor Header ───────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between px-4 sm:px-6 border-b dark:border-white/5 border-gray-200
                           bg-white/70 dark:bg-chat-bg/70 backdrop-blur-xl z-10 min-h-[3.5rem] flex-wrap gap-2 py-2"
                >
                    {/* ── File Tabs ─────────────────────────────────────────── */}
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar flex-1 min-w-0">
                        {files.length === 0 && (
                            <span className="text-xs text-gray-400 italic px-2">No files yet</span>
                        )}
                        {files.map(file => (
                            <motion.div
                                key={file.id}
                                layout
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                                        whitespace-nowrap cursor-pointer transition-all group flex-shrink-0
                                        ${activeFile?.id === file.id
                                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 border border-transparent'}`}
                                onClick={() => setActiveFile(file)}
                            >
                                <Code2 size={12} />
                                <span>{file.filename}</span>
                                {/* Delete button — creator only */}
                                {isCreator && (
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-0.5"
                                        title="Delete file"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </motion.div>
                        ))}

                        {/* Add File button — creator only */}
                        {isCreator && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddModal(true)}
                                title="Add new file (creator only)"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                                       text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5
                                       border border-dashed border-gray-300 dark:border-white/10
                                       hover:border-brand-primary/30 transition-all flex-shrink-0"
                            >
                                <Plus size={13} />
                                <span className="hidden sm:inline">Add File</span>
                            </motion.button>
                        )}
                    </div>

                    {/* ── Right Controls ─────────────────────────────────────── */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <PresenceAvatars />
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20
                                    rounded-xl text-[10px] font-bold text-green-500 uppercase tracking-widest">
                            <Shield size={11} />
                            <span className="hidden sm:inline">Live Sync</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Editor Area ─────────────────────────────────────────────── */}
                <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                    {activeFile ? (
                        <CodeEditor theme={theme} file={activeFile} />
                    ) : (
                        // Empty state
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center gap-4
                                   rounded-2xl border-2 border-dashed dark:border-white/5 border-gray-200"
                        >
                            <div className="p-4 bg-brand-primary/5 rounded-2xl">
                                <FileCode size={32} className="text-brand-primary/40" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">
                                {isCreator ? 'Click "+ Add File" to get started' : 'No files in this room yet'}
                            </p>
                            {isCreator && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white
                                           rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20"
                                >
                                    <Plus size={16} />
                                    Add File
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* ── Editor Footer ─────────────────────────────────────────────── */}
                {activeFile && (
                    <div className="px-6 py-2.5 bg-white/30 dark:bg-black/10 backdrop-blur-sm border-t
                                dark:border-white/5 border-gray-200 text-[10px] font-medium text-gray-500
                                flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                Connected
                            </span>
                            <span>UTF-8</span>
                        </div>
                        <div className="flex items-center gap-4 uppercase tracking-[0.1em] font-bold">
                            <span>Spaces: 2</span>
                            <span>{activeFile.language || 'Text'}</span>
                        </div>
                    </div>
                )}

                {/* ── Add File Modal ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {showAddModal && (
                        <AddFileModal
                            onClose={() => setShowAddModal(false)}
                            onCreate={handleCreateFile}
                        />
                    )}
                </AnimatePresence>
            </div>
        </RoomProvider>
    );
};

export default CollaborativeEditor;
