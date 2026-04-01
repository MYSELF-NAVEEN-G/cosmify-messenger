import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Trash2, ShieldOff, MoreVertical } from 'lucide-react';

const ChatMenu = ({ 
    onViewProfile, 
    onOpenTheme, 
    onClearChat, 
    onBlockUser, 
    isBlocked 
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef(null);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { 
            icon: <User size={18} />, 
            label: 'View Profile', 
            onClick: onViewProfile,
            color: 'text-neo-text'
        },
        { 
            icon: <Trash2 size={18} />, 
            label: 'Clear Chat', 
            onClick: onClearChat,
            color: 'text-neo-text'
        },
        { 
            icon: <ShieldOff size={18} />, 
            label: isBlocked ? 'Unblock' : 'Block', 
            onClick: onBlockUser,
            color: 'text-neo-text'
        }
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="neo-btn-icon !p-1.5 md:!p-2" 
                title="Terminal Options"
            >
                <MoreVertical size={18} className="md:w-[22px] md:h-[22px] opacity-80" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute right-0 top-full mt-2 w-48 py-2 neo-glass rounded-2xl z-50 overflow-hidden border border-neo-border shadow-xl"
                    >
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neo-surface transition-colors text-left ${item.color}`}
                            >
                                <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>
                                <span className="text-sm font-medium tracking-tight whitespace-nowrap">{item.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatMenu;
