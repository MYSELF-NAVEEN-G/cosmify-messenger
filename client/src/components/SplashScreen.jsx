import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const SplashScreen = () => {
  return (
    <div className="h-screen w-screen bg-[#0b0b0b] flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-32 h-32 md:w-40 md:h-40 mb-8">
            <Logo className="w-full h-full text-white drop-shadow-2xl" />
        </div>

        <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase mb-12">
            Cosmify
        </h1>

        {/* Minimal Loading Bar */}
        <div className="w-32 h-[1px] bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full bg-white/40"
          />
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1 opacity-10">
        <span className="text-[9px] font-medium text-white tracking-[0.2em] uppercase">Built with Antigravity</span>
      </div>
    </div>
  );
};

export default SplashScreen;
