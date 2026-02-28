import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import { Send, Smile, Paperclip, Hash, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatRoom = () => {
    const { currentRoom, messages, sendMessage } = useChat();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Tile Grid Background */}
            <div className="chat-tile-bg" />

            {/* Soft Glow Blobs (depth warmth behind the grid) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-brand-primary/10 blur-[120px] rounded-full animate-mesh opacity-60" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-brand-accent/10 blur-[120px] rounded-full animate-mesh opacity-40 animation-delay-2000" style={{ animationDirection: 'reverse' }} />
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-brand-primary/5 blur-[100px] rounded-full animate-mesh opacity-30 animation-delay-5000" />
            </div>

            {/* Room Header */}
            <motion.div
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-14 flex items-center justify-between px-8 border-b dark:border-white/5 border-gray-200 bg-white/60 dark:bg-chat-bg/60 backdrop-blur-xl z-10 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-400 shadow-sm border dark:border-white/5">
                        <Hash size={16} weight="bold" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="font-bold text-sm tracking-tight leading-none">{currentRoom?.name}</h2>
                        <span className="text-[10px] text-gray-500 font-mono mt-1 hover:text-brand-primary transition-colors cursor-pointer select-all bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded w-fit" title="Double click to select and copy">
                            ID: {currentRoom?.id}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-1">Live Feed</span>
                </div>
            </motion.div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar z-1 relative">
                <div className="max-w-4xl mx-auto flex flex-col">
                    <AnimatePresence initial={false} mode="popLayout">
                        {messages.map((msg, index) => (
                            <MessageBubble key={msg.id || index} message={msg} index={index} />
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white/40 dark:bg-chat-bg/40 backdrop-blur-2xl border-t dark:border-white/5 border-gray-200 z-10"
            >
                <form
                    onSubmit={handleSend}
                    className="max-w-4xl mx-auto group"
                >
                    <div className="relative flex items-end gap-2 glass-premium p-2 rounded-2xl focus-within:ring-4 ring-brand-primary/10 transition-all duration-500 group-hover:bg-white/10 dark:group-hover:bg-white/[0.07]">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="p-2.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                        >
                            <Paperclip size={20} />
                        </motion.button>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder={`Message #${currentRoom?.name}`}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none max-h-48 min-h-[44px] text-sm font-medium custom-scrollbar"
                        />

                        <div className="flex items-center gap-1">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                className="p-2.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                            >
                                <Smile size={20} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                type="submit"
                                disabled={!inputText.trim()}
                                className={`
                  p-2.5 rounded-xl transition-all flex items-center justify-center
                  ${inputText.trim()
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/40'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'}
                `}
                            >
                                <Send size={20} />
                            </motion.button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 px-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-white/5 border dark:border-white/5 rounded text-[10px] font-bold text-gray-500">
                                <span className="opacity-60">SHFT</span>
                                <span className="opacity-40">+</span>
                                <span className="opacity-60">RTN</span>
                                <span className="ml-1 opacity-80 uppercase tracking-widest">New Line</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
                            Powered by Konverge AI <Command size={10} className="text-brand-accent animate-pulse" />
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ChatRoom;
