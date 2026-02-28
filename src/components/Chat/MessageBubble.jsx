import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChat } from '../../context/ChatContext';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, index }) => {
    const { theme, currentUser } = useChat();
    const isYou = message.senderEmail === currentUser?.email || message.user === 'You';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1],
                delay: index * 0.05
            }}
            className={`flex flex-col mb-8 ${isYou ? 'items-end' : 'items-start'}`}
        >
            <div className={`flex items-center gap-3 mb-1.5 px-1 ${isYou ? 'flex-row-reverse' : ''}`}>
                <span className={`text-[11px] font-bold tracking-tight ${isYou ? 'text-brand-primary' : 'text-gray-500 animate-pulse'}`}>
                    {isYou ? 'You' : (message.senderName || message.user || 'Unknown')}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>

            <motion.div
                whileHover={{ scale: 1.002, y: -1 }}
                className={`
          max-w-[85%] rounded-[1.25rem] px-5 py-4 transition-all duration-300 relative group
          ${isYou
                        ? 'bg-brand-primary text-white rounded-tr-none shadow-premium'
                        : 'bg-white dark:bg-[#1E1E28] dark:text-gray-100 rounded-tl-none border-t border-l dark:border-white/10 border-gray-100 shadow-sm hover:shadow-md'}
        `}
            >
                <p className="text-[14px] leading-[1.6] font-medium whitespace-pre-wrap selection:bg-white/20">
                    {message.text}
                </p>

                {message.code && (
                    <motion.div
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 rounded-xl overflow-hidden text-sm font-mono shadow-2xl border dark:border-white/10 border-gray-200"
                    >
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-white/5 border-b dark:border-white/10 border-gray-200">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Javascript</span>
                        </div>
                        <SyntaxHighlighter
                            language="javascript"
                            style={theme === 'dark' ? vscDarkPlus : prism}
                            customStyle={{
                                margin: 0,
                                padding: '20px',
                                fontSize: '13px',
                                fontFamily: '"JetBrains Mono", monospace',
                                lineHeight: '1.5',
                                background: theme === 'dark' ? 'transparent' : '#f9fafb'
                            }}
                        >
                            {message.code}
                        </SyntaxHighlighter>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default MessageBubble;

