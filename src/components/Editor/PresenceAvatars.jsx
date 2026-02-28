import React from 'react';
import { useOthers, useSelf } from '../../liveblocks.config';
import { motion, AnimatePresence } from 'framer-motion';

const PresenceAvatars = () => {
    const others = useOthers();
    const currentUser = useSelf();

    return (
        <div className="flex items-center -space-x-2 overflow-hidden py-1">
            <AnimatePresence>
                {others.map(({ connectionId, presence, info }) => (
                    <motion.div
                        key={connectionId}
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: 10 }}
                        className="relative inline-block group"
                    >
                        <div
                            className="w-8 h-8 rounded-xl border-2 border-white dark:border-chat-sidebar shadow-sm flex items-center justify-center text-[10px] font-bold text-white transition-transform hover:scale-110 hover:z-10 cursor-help"
                            style={{ backgroundColor: `hsl(${connectionId % 360}, 70%, 50%)` }}
                        >
                            {info?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none font-bold tracking-tight">
                            {info?.name || 'User'}
                        </div>
                    </motion.div>
                ))}

                {currentUser && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative inline-block"
                    >
                        <div className="w-8 h-8 rounded-xl border-2 border-brand-primary bg-brand-primary shadow-lg flex items-center justify-center text-[10px] font-bold text-white z-20">
                            ME
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {others.length > 0 && (
                <span className="ml-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                    {others.length} {others.length === 1 ? 'Collaborator' : 'Collaborators'} Online
                </span>
            )}
        </div>
    );
};

export default PresenceAvatars;
