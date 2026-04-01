import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const themes = [
    { 
        id: 'default', 
        name: 'Classic Dark', 
        color: 'bg-[#0a0a0a]', 
        preview: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a0a 100%)' 
    },
    { 
        id: 'nebula', 
        name: 'Amethyst', 
        color: 'bg-[#1a0b2e]', 
        preview: 'radial-gradient(circle at 50% 50%, #2e0b5e 0%, #0a0a0a 100%)' 
    },
    { 
        id: 'cyber', 
        name: 'Emerald', 
        color: 'bg-[#0a1e1e]', 
        preview: 'radial-gradient(circle at 50% 50%, #0b3e3e 0%, #0a0a0a 100%)' 
    },
    { 
        id: 'void', 
        name: 'Pure Black', 
        color: 'bg-black', 
        preview: 'linear-gradient(to bottom, #000000, #111111)' 
    },
    { 
        id: 'starlight', 
        name: 'Midnight', 
        color: 'bg-[#0a0a1a]', 
        preview: 'radial-gradient(circle at 20% 30%, #1a1a4e 0%, #050505 100%)' 
    },
    { 
        id: 'wa-light', 
        name: 'Beige Whisper', 
        color: 'bg-[#f5f0e1]', 
        preview: '#f5f0e1',
        type: 'light'
    },
    { 
        id: 'wa-dark', 
        name: 'Normal Black', 
        color: 'bg-[#111b21]', 
        preview: '#111b21',
        type: 'dark'
    }
];

const ThemeSelector = ({ isOpen, onClose, currentTheme, onSelectTheme }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md neo-glass rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-neo-border">
                            <h3 className="text-xl font-bold text-neo-text">Browse Themes</h3>
                            <button onClick={onClose} className="neo-btn-icon !p-2">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Theme Grid */}
                        <div className="p-8 grid grid-cols-2 gap-4">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => onSelectTheme(theme.id)}
                                    className={`relative group rounded-3xl overflow-hidden aspect-video border-2 transition-all duration-300 ${
                                        currentTheme === theme.id ? 'border-neo-cyan scale-[0.98]' : 'border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div 
                                        className="absolute inset-0"
                                        style={{ background: theme.preview }}
                                    />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{theme.name}</span>
                                    </div>

                                    {currentTheme === theme.id && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neo-cyan flex items-center justify-center shadow-lg">
                                            <Check size={14} className="text-black" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer info */}
                        <div className="px-8 pb-8 text-center text-neo-text-dim">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Select a theme to customize your chat experience.</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ThemeSelector; export { themes };
