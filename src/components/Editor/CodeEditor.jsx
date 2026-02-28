import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

/**
 * CodeEditor — wraps Monaco editor for a single active file.
 * Receives file content from context (activeFile) and pushes
 * changes back via updateFileContent (debounced to avoid floods).
 */
const CodeEditor = ({ theme }) => {
    const { activeFile, updateFileContent, socketRef, currentRoom, aiSuggestedCode, setAiSuggestedCode } = useChat();
    const editorRef = useRef(null);
    const debounceRef = useRef(null);
    const isRemoteChange = useRef(false);

    // Sync editor content when active file changes
    useEffect(() => {
        if (editorRef.current && activeFile) {
            const current = editorRef.current.getValue();
            if (current !== activeFile.content) {
                // Prevent triggering onChange when we set value programmatically
                isRemoteChange.current = true;
                editorRef.current.setValue(activeFile.content || '');
                isRemoteChange.current = false;
            }
        }
    }, [activeFile?.id]); // Only re-sync when file id changes, not every content update

    // Listen for real-time editor changes from Socket.IO
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || !activeFile || !currentRoom) return;

        // Join the file's socket channel
        socket.emit('editor:join', { roomId: currentRoom.id, fileId: activeFile.id });

        const onRemoteChange = ({ fullContent, fileId }) => {
            if (fileId !== activeFile.id) return;
            if (editorRef.current && editorRef.current.getValue() !== fullContent) {
                isRemoteChange.current = true;
                editorRef.current.setValue(fullContent);
                isRemoteChange.current = false;
            }
        };

        socket.on('editor:change', onRemoteChange);
        return () => socket.off('editor:change', onRemoteChange);
    }, [socketRef, activeFile?.id, currentRoom?.id]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Set initial content from the active file
        if (activeFile?.content !== undefined) {
            editor.setValue(activeFile.content);
        }

        // Monaco premium config
        editor.updateOptions({
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1.6,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 20, bottom: 20 },
            roundedSelection: true,
            fontLigatures: true,
        });
    };

    const handleChange = (value) => {
        if (isRemoteChange.current || !activeFile) return;

        // Emit delta to socket (for real-time peers)
        if (socketRef?.current && currentRoom) {
            socketRef.current.emit('editor:change', {
                roomId: currentRoom.id,
                fileId: activeFile.id,
                fullContent: value,
            });
        }

        // Debounce REST API save (1.5 s of inactivity)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateFileContent(activeFile.id, value);
        }, 1500);
    };

    const handleAcceptDiff = () => {
        if (!aiSuggestedCode) return;
        handleChange(aiSuggestedCode);
        updateFileContent(activeFile.id, aiSuggestedCode);

        // Force the activeFile state to reflect immediately to avoid old state mount flicker
        if (editorRef.current) {
            editorRef.current.setValue(aiSuggestedCode);
        }
        setAiSuggestedCode(null);
    };

    const handleRejectDiff = () => {
        setAiSuggestedCode(null);
    };

    if (!activeFile) return null;

    return (
        <motion.div
            key={activeFile.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full h-full overflow-hidden rounded-2xl border dark:border-white/5 border-gray-200 shadow-2xl relative"
        >
            <div className="absolute inset-0 bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence>
                {aiSuggestedCode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-xl border border-white/10"
                    >
                        <button
                            onClick={handleRejectDiff}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                            <X size={14} /> Reject
                        </button>
                        <div className="w-[1px] h-4 bg-white/20" />
                        <button
                            onClick={handleAcceptDiff}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"
                        >
                            <Check size={14} /> Accept Diff
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {aiSuggestedCode ? (
                <DiffEditor
                    height="100%"
                    width="100%"
                    language={activeFile.language || 'javascript'}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    original={activeFile.content}
                    modified={aiSuggestedCode}
                    options={{
                        automaticLayout: true,
                        minimap: { enabled: false },
                        renderSideBySide: true,
                        readOnly: true,
                        fontSize: 14,
                        fontFamily: '"JetBrains Mono", monospace',
                        padding: { top: 60, bottom: 20 },
                    }}
                />
            ) : (
                <Editor
                    height="100%"
                    width="100%"
                    language={activeFile.language || 'javascript'}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    loading={
                        <div className="flex items-center justify-center h-full text-brand-primary animate-pulse font-bold text-xs">
                            Loading editor…
                        </div>
                    }
                    onMount={handleEditorDidMount}
                    onChange={handleChange}
                    options={{ automaticLayout: true }}
                />
            )}
        </motion.div>
    );
};

export default CodeEditor;
