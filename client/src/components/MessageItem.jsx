import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { Check, CheckCheck, Clock, X } from 'lucide-react';
import { useState } from 'react';

const MessageItem = ({ message, isOwn }) => {
  const { user } = useChat();
  const [lightbox, setLightbox] = useState(false);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: isOwn ? 15 : -15 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className={`flex w-full mb-4 md:mb-6 ${isOwn ? 'justify-end pl-6 md:pl-24' : 'justify-start pr-6 md:pr-24'}`}
    >
      <div 
        className={`relative max-w-[75%] md:max-w-2xl px-4 md:px-6 py-3.5 transition-all duration-300 shadow-sm border ${
          isOwn 
            ? 'ml-auto border-transparent' 
            : 'border-neo-border'
        }`}
        style={{ 
            background: isOwn ? 'var(--color-neo-msg-own)' : 'var(--color-neo-msg-other)',
            color: 'var(--color-neo-text)',
            borderRadius: `${user?.messageCorners ?? 16}px`,
            borderBottomRightRadius: isOwn ? '4px' : `${user?.messageCorners ?? 16}px`,
            borderBottomLeftRadius: !isOwn ? '4px' : `${user?.messageCorners ?? 16}px`
        }}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neo-secondary transition-colors">
              {message.senderName || 'Anonymous Agent'}
            </span>
          </div>
        )}
        
        {message.imageUrl && (
          <div className="mb-2 -mx-2">
            <img
              src={message.imageUrl}
              alt="Shared image"
              onClick={() => setLightbox(true)}
              className="w-full max-w-[280px] rounded-xl object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
              style={{ borderRadius: `${user?.messageCorners ?? 12}px` }}
            />
          </div>
        )}

        {message.text && (
          <p className="text-[15px] leading-relaxed font-light tracking-wide whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-end gap-3 opacity-60">
          <span className="text-[9px] font-bold tracking-widest text-neo-text-dim uppercase">
            {time}
          </span>
          {isOwn && (
            <span className="transition-all duration-300">
              {message.status === 'sending' ? (
                <Clock size={10} className="animate-spin text-neo-primary" />
              ) : message.status === 'seen' ? (
                <CheckCheck size={12} className="text-neo-secondary" />
              ) : (
                <Check size={12} className="text-neo-text-dim" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>

    {/* Lightbox */}
    <AnimatePresence>
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={message.imageUrl}
            alt="Full size"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};

export default MessageItem;
