import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.profileComplete) navigate('/chat');
      else navigate('/profile-setup');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    // Force account selection to prevent silent redirect loops
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      // 1. Try Popup first (Most reliable for Desktop and standard Mobile browsers)
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // 2. If popup is blocked or fails, fall back to Redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0b0b] relative overflow-hidden px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[450px] p-12 relative z-10 flex flex-col items-center"
      >
        <div className="relative w-32 h-32 mb-8">
          <div className="relative z-10 w-full h-full rounded-full border border-neo-border flex items-center justify-center bg-neo-surface overflow-hidden">
             <Logo className="w-16 h-16 text-neo-text" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            Cosmify
        </h1>
        <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-40 mb-12">
            Secure Messaging
        </p>

        {error && (
          <div className="w-full bg-neo-pink text-white px-4 py-3 rounded-xl mb-8 text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_#ff4d8d] text-center border border-white/10">
            {error}
          </div>
        )}

        <div className="w-full space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 neo-glass border-neo-primary/30 hover:border-neo-primary hover:bg-neo-primary/5 text-white rounded-full flex items-center justify-center gap-4 transition-all group relative overflow-hidden shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neo-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            <span className="font-bold tracking-[0.1em] text-[13px] uppercase">
                {loading ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
