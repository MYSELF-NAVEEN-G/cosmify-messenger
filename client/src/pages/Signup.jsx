import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { user } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/chat');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: formData.username,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`
      });

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        username: formData.username,
        email: formData.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
        createdAt: new Date().toISOString(),
      });

      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-wa-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-52 bg-wa-teal z-0" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[500px] bg-wa-sidebar z-10 shadow-2xl rounded-sm p-12 mt-10 border border-wa-border"
      >
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-[28px] font-light text-wa-text">Create your profile</h2>
          <p className="text-wa-text-dim text-sm mt-2">Enter your name and details to get started</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-wa-border focus-within:border-wa-teal transition-all">
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-transparent border-none outline-none py-2 text-wa-text placeholder:text-wa-text-dim text-[15px]"
              placeholder="Username"
              required
            />
          </div>
          <div className="border-b border-wa-border focus-within:border-wa-teal transition-all">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent border-none outline-none py-2 text-wa-text placeholder:text-wa-text-dim text-[15px]"
              placeholder="Email address"
              required
            />
          </div>
          <div className="border-b border-wa-border focus-within:border-wa-teal transition-all">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent border-none outline-none py-2 text-wa-text placeholder:text-wa-text-dim text-[15px]"
              placeholder="Password"
              required
            />
          </div>
          <div className="border-b border-wa-border focus-within:border-wa-teal transition-all">
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-transparent border-none outline-none py-2 text-wa-text placeholder:text-wa-text-dim text-[15px]"
              placeholder="Confirm Password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2.5 bg-wa-teal hover:bg-wa-teal/90 text-white rounded-md transition-all font-medium text-[14px] uppercase tracking-wider shadow-md"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-wa-teal hover:underline text-[14px]">
            Already have an account? Login here
          </Link>
        </div>
      </motion.div>
      
      <div className="mt-12 opacity-20 flex items-center gap-2">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.178L2 22l4.957-1.301C8.384 21.528 10.121 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
        <span className="text-xs font-bold uppercase tracking-[3px]">WhatsApp</span>
      </div>
    </div>
  );
};

export default Signup;
