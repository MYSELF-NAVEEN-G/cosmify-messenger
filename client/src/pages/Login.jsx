import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { auth, googleProvider, appleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';

const Login = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState('social'); // 'social' or 'email'
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const { user } = useChat();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.profileComplete) navigate('/chat');
            else navigate('/profile-setup');
        }
    }, [user, navigate]);

    const handleSocialLogin = async (provider) => {
        setError('');
        setLoading(true);
        
        if (provider === googleProvider) {
            provider.setCustomParameters({ prompt: 'select_account' });
        }

        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(err.code)) {
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirErr) {
                    console.error("Redirect failed:", redirErr);
                    setError('Sign in failed. Please check your browser settings.');
                    setLoading(false);
                }
            } else {
                console.error("Authentication error:", err);
                setError('Failed to sign in. Please try again.');
                setLoading(false);
            }
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignup) {
                await createUserWithEmailAndPassword(auth, email, password);
                // Profile completion will happen in ProfileSetup.jsx
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error("Email auth error:", err);
            let msg = 'Authentication failed.';
            if (err.code === 'auth/user-not-found') msg = 'Account not found. Please sign up.';
            if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            if (err.code === 'auth/email-already-in-use') msg = 'Email already in use. Please login.';
            if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0b0b] relative overflow-hidden px-6">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neo-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neo-pink/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[450px] p-8 md:p-12 relative z-10 flex flex-col items-center"
            >
                <motion.div 
                    layoutId="logo"
                    className="relative w-24 h-24 mb-6"
                >
                    <div className="relative z-10 w-full h-full rounded-full border border-neo-border flex items-center justify-center bg-neo-surface overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <Logo className="w-12 h-12 text-neo-text" />
                    </div>
                </motion.div>

                <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                    Cosmify
                </h1>
                <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-40 mb-10">
                    Next-Gen Messaging
                </p>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-neo-pink/10 border border-neo-pink/30 text-neo-pink px-4 py-3 rounded-xl mb-6 text-[11px] font-bold uppercase tracking-widest text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {authMode === 'social' ? (
                        <motion.div
                            key="social"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full space-y-4"
                        >
                            {/* Google Button */}
                            <button
                                onClick={() => handleSocialLogin(googleProvider)}
                                disabled={loading}
                                className="w-full py-4 neo-glass border-white/5 hover:border-neo-primary/50 hover:bg-neo-primary/5 text-white rounded-2xl flex items-center justify-center gap-4 transition-all group relative overflow-hidden shadow-lg disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                                </svg>
                                <span className="font-bold tracking-[0.1em] text-[12px] uppercase">
                                    Google
                                </span>
                            </button>

                            {/* Apple Button */}
                            <button
                                onClick={() => handleSocialLogin(appleProvider)}
                                disabled={loading}
                                className="w-full py-4 neo-glass border-white/5 hover:border-white/30 hover:bg-white/5 text-white rounded-2xl flex items-center justify-center gap-4 transition-all group relative overflow-hidden shadow-lg disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-43.8-18.2-72.9-17.5C44 144.1 7.1 190.6 7.1 274.6c0 51.5 20.1 114.7 67.9 164 22.8 23.5 54.3 54.4 87 52.8 33.1-1.6 44.4-23.7 86.6-23.7 41.6 0 52.1 23.7 86.6 23.1 33.1-.6 62-28.7 84.7-52.8 19.3-19.1 31.9-39.2 39.1-59.5-81.1-33.8-134.4-110.6-133.4-210.8zM273 83.2c18.5-23.5 31.2-56 27.8-87.8-29.2 1.1-64.8 19.4-85.7 44.5-17.8 21.3-33.3 54.7-29.7 85.5 32.7 2.6 66.8-16.7 87.6-42.2z"/>
                                </svg>
                                <span className="font-bold tracking-[0.1em] text-[12px] uppercase">
                                    Apple
                                </span>
                            </button>

                            <div className="flex items-center gap-4 py-4 opacity-20">
                                <div className="h-px flex-1 bg-white" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">OR</span>
                                <div className="h-px flex-1 bg-white" />
                            </div>

                            <button
                                onClick={() => setAuthMode('email')}
                                className="w-full py-4 text-white/40 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Continue with Email
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="email"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleEmailAuth}
                            className="w-full space-y-5"
                        >
                            <div className="space-y-4">
                                <div className="group relative">
                                    <input
                                        type="email"
                                        placeholder="EMAIL ADDRESS"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 focus:border-neo-primary/50 rounded-2xl px-6 py-4 text-white text-[12px] font-bold tracking-widest outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
                                <div className="group relative">
                                    <input
                                        type="password"
                                        placeholder="PASSWORD"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 focus:border-neo-primary/50 rounded-2xl px-6 py-4 text-white text-[12px] font-bold tracking-widest outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-neo-primary text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,153,0.3)] disabled:opacity-50"
                            >
                                {loading ? 'PROCESSING...' : (isSignup ? 'CREATE ACCOUNT' : 'SIGN IN')}
                            </button>

                            <div className="flex flex-col items-center gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsSignup(!isSignup)}
                                    className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    {isSignup ? "ALREADY HAVE AN ACCOUNT? LOGIN" : "NEED AN ACCOUNT? SIGN UP"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('social')}
                                    className="text-neo-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    BACK TO SOCIAL
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Login;
