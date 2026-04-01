import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Phone, Info } from 'lucide-react';

const ContactDrawer = ({ isOpen, onClose, contact }) => {
  if (!contact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for Desktop (if needed) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-full md:w-[400px] z-50 bg-neo-bg flex flex-col shadow-2xl border-l border-neo-border"
          >
            {/* Header */}
            <div className="h-[70px] md:h-[90px] bg-neo-surface flex items-center px-6 border-b border-neo-border">
              <div className="flex items-center gap-6 text-neo-text">
                <button onClick={onClose} className="hover:bg-neo-text/5 p-2 rounded-full transition-colors text-neo-purple">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-[18px] font-black uppercase italic tracking-tighter text-neo-text">Contact Information</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
              {/* Avatar Section */}
              <div className="relative mb-10">
                <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-neo-purple shadow-[0_0_30px_rgba(106,13,173,0.3)]">
                  <img 
                    src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`} 
                    alt="Identity" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Name Section */}
              <div className="w-full space-y-4 mb-10">
                <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">Name</label>
                <div className="flex items-center border-b border-neo-border pb-3">
                  <User size={18} className="text-neo-text-dim/40 mr-4" />
                  <span className="text-[18px] text-neo-text font-light tracking-tight">{contact.username}</span>
                </div>
              </div>

              {/* Bio Section */}
              <div className="w-full space-y-4 mb-10">
                <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">Bio</label>
                <div className="flex items-start border-b border-neo-border pb-4">
                  <Info size={18} className="text-neo-text-dim/40 mr-4 mt-1 flex-shrink-0" />
                  <p className="text-[15px] text-neo-text font-light leading-relaxed">
                    {contact.bio || "Neural link active. No status broadcasted."}
                  </p>
                </div>
              </div>

              {/* ID Section */}
              <div className="w-full space-y-4 mb-10">
                <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">Phone Number</label>
                <div className="flex items-center border-b border-neo-border pb-3">
                  <Phone size={18} className="text-neo-text-dim/40 mr-4" />
                  <span className="text-[18px] text-neo-text font-mono tracking-[0.3em]">{contact.phone}</span>
                </div>
              </div>

              {/* Security Banner */}
              <div className="mt-auto w-full p-6 bg-neo-purple/5 rounded-3xl border border-neo-purple/10 text-center">
                <p className="text-[9px] text-white font-bold uppercase tracking-[0.2em] leading-relaxed">
                   Biometric verification complete.<br/>Neural transmission end-to-end encrypted.
                </p>
              </div>

            </div>

            <div className="p-8 text-center opacity-10">
              <p className="text-[10px] font-black uppercase tracking-[6px]">Secure Protocol Active</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactDrawer;
