import React from 'react';
import { useChat } from '../../context/ChatContext';
import { motion } from 'framer-motion';

/**
 * UserList — shows participants of the currently active room.
 * Participants are derived from the room object (array of emails).
 * Highlights the current user's own entry.
 */
const UserList = () => {
    const { currentRoom, currentUser } = useChat();

    // Participants should show everyone who is allowed into the room, not just those who have actively joined.
    const participants = Array.from(new Set([
        ...(currentRoom?.allowedEmails || []),
        ...(currentRoom?.participants || [])
    ]));

    if (!currentRoom) return null;

    return (
        <div className="p-6 h-72 flex flex-col overflow-hidden">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-6 px-1">
                Participants ({participants.length})
            </h2>
            <div className="space-y-4 overflow-y-auto custom-scrollbar">
                {participants.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-1">No participants yet.</p>
                )}
                {participants.map((email, index) => {
                    const isYou = email === currentUser?.email;
                    const isCreator = email === currentRoom?.creatorEmail;
                    // Display name: part before @ symbol, capitalised
                    const displayName = email.split('@')[0];

                    return (
                        <motion.div
                            key={email}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.04 }}
                            className="flex items-center gap-3 px-1 group cursor-default"
                        >
                            <div className="relative">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className={`
                                        w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                                        ${isYou
                                            ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 ring-2 ring-brand-primary/20'
                                            : 'bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 border dark:border-white/5 shadow-sm'}
                                    `}
                                >
                                    {displayName.charAt(0).toUpperCase()}
                                </motion.div>
                                {/* Online indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-chat-sidebar shadow-sm" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold group-hover:text-brand-primary transition-colors truncate">
                                    {isYou ? `${displayName} (you)` : displayName}
                                </span>
                                <span className="text-[10px] font-medium text-gray-500">
                                    {isCreator ? 'Creator' : 'Member'}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserList;
