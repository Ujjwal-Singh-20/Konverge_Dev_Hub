import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Terminal, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const { setCurrentUser } = useChat();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const idToken = await user.getIdToken();
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email,
                    idToken
                });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [setCurrentUser]);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Sign-in failed. Please check your config.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-chat-bg">
                <div className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-chat-bg p-4 relative overflow-hidden">
            <div className="chat-tile-bg absolute inset-0 z-0 opacity-50" />
            <div className="absolute inset-0 bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm bg-white/70 dark:bg-black/40 backdrop-blur-2xl border dark:border-white/10 border-gray-200 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center"
            >
                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 ring-4 ring-white/10 mb-6">
                    <Terminal size={32} />
                </div>
                <h1 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Konverge</h1>
                <p className="text-sm font-medium text-gray-500 mb-8 max-w-[250px]">
                    Sign in to join collaborative coding rooms and chat with your team.
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    className="w-full relative flex items-center justify-center gap-3 bg-white dark:bg-white/5 border dark:border-white/10 border-gray-200 p-3.5 rounded-xl font-bold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Continue with Google
                </motion.button>
                <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    <Lock size={12} /> Secure Access
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
