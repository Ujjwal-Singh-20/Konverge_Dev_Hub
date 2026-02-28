import React, { useState, useEffect } from 'react';
import { useChat } from './context/ChatContext';
import { io } from 'socket.io-client';
import Login from './components/Auth/Login';
import { auth } from './config/firebase';
import { signOut } from 'firebase/auth';
import RoomList from './components/Sidebar/RoomList';
import UserList from './components/Sidebar/UserList';
import ChatRoom from './components/Chat/ChatRoom';
import AIAssistant from './components/AIPanel/AIAssistant';
import CollaborativeEditor from './components/Editor/CollaborativeEditor';
import { PanelRight, Menu, X, Moon, Sun, Terminal, MessageSquare, Code2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
    const { theme, toggleTheme, currentUser, socketRef } = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'editor'

    useEffect(() => {
        if (!currentUser) return;
        const socket = io('http://localhost:4000', {
            auth: { token: currentUser.idToken },
        });
        socketRef.current = socket;
        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [currentUser, socketRef]);

    if (!currentUser) {
        return <Login />;
    }

    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark bg-chat-bg text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-500 overflow-hidden`}>
            {/* Header */}
            <header className="h-14 border-b dark:border-white/5 border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-30 bg-white/70 dark:bg-chat-bg/70 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg lg:hidden transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mr-4"
                    >
                        <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 ring-1 ring-white/20">
                            <Terminal size={20} weight="bold" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-base tracking-tight leading-none">Konverge</h1>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Dev Hub</span>
                        </div>
                    </motion.div>

                    {/* Mode Switcher */}
                    <nav className="hidden md:flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border dark:border-white/5 border-gray-200">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat'
                                ? 'bg-white dark:bg-white/10 shadow-sm text-brand-primary'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <MessageSquare size={14} />
                            <span>Chat Hub</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative ${activeTab === 'editor'
                                ? 'bg-white dark:bg-white/10 shadow-sm text-brand-primary'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <Code2 size={14} />
                            <span>Live Code</span>
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                            </span>
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ rotate: 15, backgroundColor: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTheme}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border dark:border-white/10 border-gray-200 transition-colors"
                        aria-label="Toggle Theme"
                    >
                        <AnimatePresence mode="wait">
                            {theme === 'dark' ? (
                                <motion.div
                                    key="dark"
                                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Sun size={18} className="text-yellow-400" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="light"
                                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Moon size={18} className="text-indigo-600" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-500 hover:text-red-500"
                        title="Log Out"
                    >
                        <LogOut size={18} />
                    </motion.button>

                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1" />

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                        className={`flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-300 border ${isAiPanelOpen
                            ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary shadow-ai-glow'
                            : 'hover:bg-gray-200 dark:hover:bg-white/5 border-transparent text-gray-500'
                            }`}
                    >
                        <PanelRight size={18} />
                        <span className="text-xs font-semibold hidden sm:block">AI Assistant</span>
                    </motion.button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Sidebar Left (Only shown in chat mode or if manually opened) */}
                <AnimatePresence>
                    {(isSidebarOpen || window.innerWidth >= 1024) && activeTab === 'chat' && (
                        <motion.aside
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            className="fixed lg:relative z-20 h-full w-64 border-r dark:border-white/5 border-gray-200 bg-white dark:bg-chat-sidebar transition-colors"
                        >
                            <div className="flex flex-col w-full h-full">
                                <RoomList />
                                <div className="mt-auto border-t dark:border-white/5 border-gray-200">
                                    <UserList />
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Overlay for mobile sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && activeTab === 'chat' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 lg:hidden z-10 backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Dynamic Content Area */}
                <motion.section
                    layout
                    className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-chat-bg transition-all"
                >
                    <AnimatePresence mode="wait">
                        {activeTab === 'chat' ? (
                            <motion.div
                                key="chat-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full h-full flex flex-col"
                            >
                                <ChatRoom />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="editor-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full h-full flex flex-col"
                            >
                                <CollaborativeEditor theme={theme} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* AI Assistant Right Panel */}
                <AnimatePresence>
                    {isAiPanelOpen && (
                        <motion.aside
                            initial={{ x: 384 }}
                            animate={{ x: 0 }}
                            exit={{ x: 384 }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            className="fixed lg:relative z-20 h-full w-80 sm:w-96 border-l dark:border-white/5 border-gray-200 bg-white dark:bg-chat-sidebar transition-colors right-0"
                        >
                            <AIAssistant onClose={() => setIsAiPanelOpen(false)} />
                        </motion.aside>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
