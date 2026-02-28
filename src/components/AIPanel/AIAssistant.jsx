import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Sparkles, Send, X, Bot, Clock, ChevronRight, Terminal, Key, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant = ({ onClose }) => {
    const { askAi, aiResponses, isAiLoading, theme, saveToken, setAiSuggestedCode } = useChat();
    const [query, setQuery] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [isSavingToken, setIsSavingToken] = useState(false);
    const [tokenSuccess, setTokenSuccess] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (id, code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            askAi(query);
            setQuery('');
        }
    };

    const handleSaveToken = async (e) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        setIsSavingToken(true);
        try {
            await saveToken(tokenInput.trim());
            setTokenSuccess(true);
            setTokenInput('');
            setTimeout(() => setTokenSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save token', err);
        } finally {
            setIsSavingToken(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-inherit">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b dark:border-white/5 border-gray-200 bg-brand-accent/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-accent animate-pulse" size={18} />
                    <h2 className="font-bold text-sm tracking-tight text-brand-accent uppercase tracking-[0.1em]">AI Assistant</h2>
                </div>
                <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X size={18} />
                </motion.button>
            </div>

            {/* Responses Feed */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                <AnimatePresence mode="popLayout">
                    {aiResponses.length === 0 && !isAiLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-dashed dark:border-white/10 border-gray-200"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-6 shadow-ai-glow">
                                <Bot size={32} className="text-brand-accent" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500 max-w-[200px] leading-relaxed">
                                Connect your logic. Ask any coding question to get instant help.
                            </p>
                        </motion.div>
                    )}

                    {isAiLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-start gap-4 animate-pulse-soft"
                        >
                            <div className="w-9 h-9 rounded-xl bg-brand-accent/20 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-md w-1/3" />
                                <div className="h-24 bg-gray-200 dark:bg-white/10 rounded-xl w-full" />
                            </div>
                        </motion.div>
                    )}

                    {aiResponses.map((res, idx) => (
                        <motion.div
                            key={res.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                                <Clock size={12} className="text-brand-accent" />
                                <span>{res.timestamp}</span>
                                <ChevronRight size={12} className="opacity-30" />
                                <span className="text-brand-accent truncate max-w-[120px]">{res.query}</span>
                            </div>

                            <div className="glass-surface p-5 rounded-2xl dark:bg-white/5 border dark:border-white/10 border-gray-100 shadow-sm text-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-1.5 bg-brand-accent/10 rounded-lg text-brand-accent">
                                        <Terminal size={14} />
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                        {res.answer}
                                    </p>
                                </div>

                                {res.code && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-xl overflow-hidden border dark:border-white/10 border-gray-200 shadow-2xl"
                                    >
                                        <div className="bg-gray-100 dark:bg-white/5 px-4 py-2 flex items-center justify-between border-b dark:border-white/10 border-gray-200">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                {res.type === 'updated' ? 'Suggested Changes' : 'New Code'}
                                            </span>
                                            {res.type === 'updated' ? (
                                                <button
                                                    onClick={() => setAiSuggestedCode(res.code)}
                                                    className="text-[10px] text-brand-accent hover:text-brand-accent/80 font-bold uppercase transition-colors"
                                                >
                                                    View Diff
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCopy(res.id, res.code)}
                                                    className="text-[10px] text-brand-accent hover:text-brand-accent/80 font-bold uppercase transition-colors flex items-center gap-1"
                                                >
                                                    {copiedId === res.id ? <><Check size={12} /> Copied</> : 'Copy Code'}
                                                </button>
                                            )}
                                        </div>
                                        <SyntaxHighlighter
                                            language="javascript"
                                            style={theme === 'dark' ? vscDarkPlus : prism}
                                            customStyle={{
                                                margin: 0,
                                                padding: '20px',
                                                fontSize: '12.5px',
                                                fontFamily: '"JetBrains Mono", monospace',
                                                background: 'transparent'
                                            }}
                                        >
                                            {res.code}
                                        </SyntaxHighlighter>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Query Input */}
            <div className="p-6 border-t dark:border-white/5 border-gray-200 bg-white/30 dark:bg-black/10 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask AI assistant..."
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-accent/50 focus:ring-4 ring-brand-accent/5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        />
                        <div className="absolute right-3 top-2.5 text-brand-accent/30 pointer-events-none">
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!query.trim() || isAiLoading}
                        className="p-2.5 bg-brand-accent text-brand-surface rounded-xl hover:shadow-ai-glow disabled:opacity-30 transition-all shadow-lg font-bold"
                    >
                        <Send size={20} />
                    </motion.button>
                </form>

                {/* Token Configuration */}
                <form onSubmit={handleSaveToken} className="flex gap-2 mt-4 pt-4 border-t dark:border-white/5 border-gray-200">
                    <div className="flex-1 relative">
                        <input
                            type="password"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="Set Gemini API Key..."
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-accent/50 focus:ring-4 ring-brand-accent/5 rounded-xl px-4 py-2 text-xs font-medium transition-all"
                        />
                        <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                            <Key size={14} />
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!tokenInput.trim() || isSavingToken}
                        className={`px-3 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1
                            ${tokenSuccess ? 'bg-green-500' : 'bg-gray-800 dark:bg-white/10 hover:bg-gray-900 dark:hover:bg-white/20'}`}
                    >
                        {isSavingToken ? 'Saving...' : tokenSuccess ? <Check size={14} /> : 'Save'}
                    </motion.button>
                </form>

            </div>
        </div>
    );
};

export default AIAssistant;
