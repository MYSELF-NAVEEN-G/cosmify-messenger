import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { auth, googleProvider, appleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Laptop, Monitor, Zap, Palette, Users, User, Globe, ChevronDown } from 'lucide-react';
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

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    return (
        <div className="min-h-screen bg-[#0b0b0b] text-white selection:bg-neo-primary/30 overflow-x-hidden custom-scrollbar">
            {/* HERO & LOGIN SECTION */}
            <section className="min-h-screen flex flex-col items-center justify-center relative px-6 py-20 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neo-primary/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neo-pink/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-full max-w-[450px] p-8 md:p-12 relative z-10 flex flex-col items-center neo-glass border-white/5 rounded-[40px] shadow-2xl"
                >
                    <motion.div 
                        layoutId="logo"
                        className="relative w-24 h-24 mb-6"
                    >
                        <div className="relative z-10 w-full h-full rounded-full border border-neo-border flex items-center justify-center bg-neo-surface overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <Logo className="w-12 h-12 text-neo-primary" />
                        </div>
                    </motion.div>

                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">
                        Cosmify
                    </h1>
                    <p className="text-white text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-10">
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
                                <button
                                    onClick={() => handleSocialLogin(googleProvider)}
                                    disabled={loading}
                                    className="w-full py-4 bg-white/5 border border-white/10 hover:border-neo-primary/50 hover:bg-neo-primary/5 text-white rounded-2xl flex items-center justify-center gap-4 transition-all group relative overflow-hidden disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                                        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                                    </svg>
                                    <span className="font-bold tracking-[0.15em] text-[11px] uppercase">Google Account</span>
                                </button>

                                <button
                                    onClick={() => handleSocialLogin(appleProvider)}
                                    disabled={loading}
                                    className="w-full py-4 bg-white/5 border border-white/10 hover:border-white/40 hover:bg-white/5 text-white rounded-2xl flex items-center justify-center gap-4 transition-all group relative overflow-hidden disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-43.8-18.2-72.9-17.5C44 144.1 7.1 190.6 7.1 274.6c0 51.5 20.1 114.7 67.9 164 22.8 23.5 54.3 54.4 87 52.8 33.1-1.6 44.4-23.7 86.6-23.7 41.6 0 52.1 23.7 86.6 23.1 33.1-.6 62-28.7 84.7-52.8 19.3-19.1 31.9-39.2 39.1-59.5-81.1-33.8-134.4-110.6-133.4-210.8zM273 83.2c18.5-23.5 31.2-56 27.8-87.8-29.2 1.1-64.8 19.4-85.7 44.5-17.8 21.3-33.3 54.7-29.7 85.5 32.7 2.6 66.8-16.7 87.6-42.2z"/>
                                    </svg>
                                    <span className="font-bold tracking-[0.15em] text-[11px] uppercase">Apple Identity</span>
                                </button>

                                <div className="flex items-center gap-4 py-4 opacity-20">
                                    <div className="h-px flex-1 bg-white" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
                                    <div className="h-px flex-1 bg-white" />
                                </div>

                                <button
                                    onClick={() => setAuthMode('email')}
                                    className="w-full py-4 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
                                >
                                    <span className="group-hover:scale-110 transition-transform"><Globe size={14} /></span>
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
                                    <input
                                        type="email"
                                        placeholder="EMAIL ADDRESS"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 focus:border-neo-primary/50 rounded-2xl px-6 py-4 text-white text-[11px] font-bold tracking-widest outline-none transition-all placeholder:text-white/20 uppercase"
                                    />
                                    <input
                                        type="password"
                                        placeholder="PASSWORD"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 focus:border-neo-primary/50 rounded-2xl px-6 py-4 text-white text-[11px] font-bold tracking-widest outline-none transition-all placeholder:text-white/20 uppercase"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-neo-primary text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all shadow-[0_0_30px_rgba(0,255,153,0.2)] disabled:opacity-50"
                                >
                                    {loading ? 'PROCESSING...' : (isSignup ? 'CREATE ACCOUNT' : 'AUTHENTICATE')}
                                </button>

                                <div className="flex flex-col items-center gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsSignup(!isSignup)}
                                        className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        {isSignup ? "ALREADY HAVE AN ACCOUNT? LOGIN" : "NEED AN ACCOUNT? SIGN UP"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('social')}
                                        className="text-neo-primary hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <ChevronDown size={14} className="rotate-90" /> BACK TO SOCIAL
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 uppercase font-black tracking-[0.4em] text-[8px]"
                >
                    <span>Learn More</span>
                    <motion.div 
                        animate={{ y: [0, 5, 0] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <ChevronDown size={14} />
                    </motion.div>
                </motion.div>
            </section>

            {/* COMPATIBILITY SECTION */}
            <section className="py-32 px-6 bg-white/[0.02] border-y border-white/[0.05]">
                <div className="max-w-[1200px] mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Everywhere You Are</h2>
                        <div className="h-1 w-20 bg-neo-primary mx-auto rounded-full" />
                        <p className="text-neo-text-dim text-sm tracking-widest uppercase max-w-xl mx-auto leading-relaxed">
                            Seamlessly stay connected across all your favorite devices without missing a single beat.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "APPLE", icon: Smartphone, desc: "OPTIMIZED FOR IPHONE, IPAD, AND MACBOOK PRO.", sub: "PWA & WEBKIT READY" },
                            { name: "ANDROID", icon: Monitor, desc: "FLUID EXPERIENCE ON ALL SAMSUNG, PIXEL, AND TABLETS.", sub: "PLAY READY DEP" },
                            { name: "LAPTOPS", icon: Laptop, desc: "FULL DESKTOP CONTROL ON WINDOWS, LINUX, AND CHROME.", sub: "DESKTOP ENGINE V3" }
                        ].map((dev, i) => (
                            <motion.div
                                key={dev.name}
                                {...fadeInUp}
                                transition={{ delay: i * 0.1 }}
                                className="neo-glass border-white/5 p-10 rounded-[40px] group hover:border-neo-primary/40 transition-all flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-neo-primary/20 group-hover:text-neo-primary transition-all">
                                    <dev.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter uppercase mb-4 italic italic">{dev.name}</h3>
                                <p className="text-[10px] leading-relaxed tracking-[0.2em] uppercase font-bold text-white/40 group-hover:text-white/70 transition-colors">
                                    {dev.desc}
                                </p>
                                <div className="mt-8 text-[8px] font-black tracking-[0.4em] text-neo-primary opacity-40 uppercase">{dev.sub}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-32 px-6">
                <div className="max-w-[1200px] mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Universal Features</h2>
                        <div className="h-1 w-20 bg-neo-pink mx-auto rounded-full" />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "FAST SYNC", icon: Zap, desc: "MESSAGES ARRIVE INSTANTLY ON ALL CONNECTED DEVICES." },
                            { title: "NEO THEMES", icon: Palette, desc: "SWITCH BETWEEN ICONIC SPACE AND DARK NEO MODES." },
                            { title: "GROUP HUB", icon: Users, desc: "ADVANCED GROUP TOOLS TO COLLABORATE WITH ANYONE." },
                            { title: "YOUR ID", icon: User, desc: "EXPRESS YOURSELF WITH FULL PROFILE CUSTOMIZATION." }
                        ].map((feat, i) => (
                            <motion.div
                                key={feat.title}
                                {...fadeInUp}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 border border-white/5 rounded-[32px] hover:bg-white/[0.02] transition-all"
                            >
                                <feat.icon size={24} className="text-white/40 mb-6" />
                                <h4 className="text-sm font-black tracking-widest uppercase mb-3 text-white">{feat.title}</h4>
                                <p className="text-[10px] leading-relaxed tracking-[0.15em] uppercase text-white/30 font-bold">
                                    {feat.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section className="py-32 px-6 mb-20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-neo-primary/5 to-transparent pointer-events-none" />
                <div className="max-w-[800px] mx-auto text-center relative z-10">
                    <motion.div {...fadeInUp} className="space-y-10">
                        <Logo className="w-16 h-16 text-neo-primary mx-auto opacity-40" />
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">The Next Era Of Messaging</h2>
                        <p className="text-sm md:text-base text-neo-text-dim tracking-widest uppercase leading-loose max-w-2xl mx-auto">
                            COSMIFY WAS BORN FROM THE IDEA THAT COMMUNICATION SHOULD BE AS STUNNING AS IT IS FUNCTIONAL. WE'VE BUILT A HUB WHERE STYLE MEETS SPEED, ALLOWING YOU TO EXPRESS YOURSELF FREELY WITHOUT THE CLUTTER OF TRADITIONAL APPS.
                        </p>
                        <div className="flex justify-center gap-12 pt-10">
                            {[
                                { val: "256", label: "GROUPS" },
                                { val: "SYNC", label: "REAL-TIME" },
                                { val: "FREE", label: "FOREVER" }
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-2xl font-black text-white italic tracking-tighter">{stat.val}</div>
                                    <div className="text-[8px] font-black tracking-[0.3em] text-neo-primary uppercase opacity-60">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-20">
                     <div className="flex items-center gap-3">
                        <Logo className="w-5 h-5" />
                        <span className="font-black text-xs tracking-[0.3em] uppercase">Cosmify</span>
                     </div>
                     <span className="text-[8px] font-black tracking-[0.5em] uppercase">&copy; 2026 NEXT-GEN MESSAGING GROUP</span>
                </div>
            </footer>
        </div>
    );
};

export default Login;
