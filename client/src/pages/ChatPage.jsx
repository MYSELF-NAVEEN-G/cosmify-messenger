import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import ChatBox from '../components/ChatBox';
import SettingsDrawer from '../components/SettingsDrawer';
import { useChat } from '../context/ChatContext';
import { LogOut, MessageSquare, MoreVertical, Menu, UserCircle, Settings, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { themes } from '../components/ThemeSelector';
import Logo from '../components/Logo';
import CreateGroupDrawer from '../components/CreateGroupDrawer';

const ChatPage = () => {
  const { user, logout, selectedChat, setSelectedChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Reactive listener for mobile view
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Derived active theme and class
  const activeThemeId = selectedChat?.theme || user?.defaultTheme || 'default';
  const activeTheme = themes.find(t => t.id === activeThemeId);

  return (
    <div className={`h-full w-full flex relative overflow-hidden bg-neo-bg transition-colors duration-500`}>
      {/* Background layer handle by App.jsx */}
      {/* Sidebar Glass Panel (Full screen on mobile if no chat, side-by-side on desktop) */}
      <AnimatePresence mode="wait">
        {(!selectedChat || !isMobile) && (
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`flex-none w-full md:w-[350px] lg:w-[400px] h-full bg-neo-surface z-20 flex flex-col border-r border-neo-border ${selectedChat && isMobile ? 'hidden' : 'flex'}`}
          >
            {/* Sidebar Header */}
            <div className="h-[80px] px-6 flex items-center justify-between border-b border-neo-border bg-neo-surface">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 flex items-center justify-center p-1">
                  <Logo className="w-full h-full text-neo-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black text-neo-text tracking-widest uppercase italic truncate">Cosmify</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="neo-btn-icon" 
                  title="New Group" 
                  onClick={() => setShowCreateGroup(true)}
                >
                  <UserPlus size={20} />
                </button>
                <button 
                  className="neo-btn-icon" 
                  title="Settings" 
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Settings & Profile Drawer Overlay */}
            <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Create Group Drawer Overlay */}
            <CreateGroupDrawer isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />

            {/* Chat List Search & Items */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <ChatList />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Hub Panel */}
      <main className={`flex-1 h-full relative z-10 flex flex-col overflow-hidden shadow-2xl ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatBox />
      </main>
      
    </div>
  );
};

export default ChatPage;
