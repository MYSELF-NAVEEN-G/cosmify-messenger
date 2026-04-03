import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Send, Smile, Paperclip, MoreVertical, Search, Mic, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageItem from './MessageItem';
import ContactDrawer from './ContactDrawer';
import ChatMenu from './ChatMenu';
import ThemeSelector, { themes } from './ThemeSelector';
import Logo from './Logo';
import GroupInfoDrawer from './GroupInfoDrawer';

const ChatBox = () => {
  const { selectedChat, user, setSelectedChat, updateSettings } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState('offline');
  const [otherUserLastSeenPrivacy, setOtherUserLastSeenPrivacy] = useState('everyone');
  const [imagePreview, setImagePreview] = useState(null); // { file, dataUrl }
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const scrollRef = useRef();

  // Determine if the current contact is blocked
  const isBlocked = user?.blockedUsers?.includes(selectedChat?.otherParticipant?._id);
  // Priority: If the chat had a specific theme, we fall back to user default. 
  // Since we are changing theme for ALL chats now, we primarily rely on user default.
  const chatTheme = user?.defaultTheme || 'default';
  const themeData = themes.find(t => t.id === chatTheme) || themes[0];

  useEffect(() => {
    if (!selectedChat?._id) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedChat._id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle pending serverTimestamp (null for a few ms)
        const createdAt = data.createdAt 
            ? (data.createdAt.toDate?.()?.toISOString() || new Date(data.createdAt).toISOString())
            : new Date().toISOString();

        return {
            _id: doc.id,
            ...data,
            createdAt
        };
      });
      
      // Filter disappearing messages
      const now = new Date();
      const filteredMsgs = msgs.filter(msg => {
          if (!user?.disappearingMessages || user?.disappearingMessages === 'off') return true;
          const msgDate = new Date(msg.createdAt);
          const diffInHours = (now - msgDate) / (1000 * 60 * 60);
          
          if (user.disappearingMessages === '1d') return diffInHours <= 24;
          if (user.disappearingMessages === '7d') return diffInHours <= 24 * 7;
          if (user.disappearingMessages === '90d') return diffInHours <= 24 * 90;
          return true;
      });

      setMessages(filteredMsgs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Check Firestore rules.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedChat?._id, user?.disappearingMessages]);

  /** 
   * MARK AS SEEN LOGIC 
   * When new messages arrive, if they are from the other participant and 
   * this chat box is active, mark them as seen and reset our unread count.
   */
  useEffect(() => {
    if (!selectedChat?._id || !user?._id || messages.length === 0) return;

    const markAsSeen = async () => {
      const batch = writeBatch(db);
      let updatedCount = 0;
      let shouldUpdateLastMessageStatus = false;

      // 1. Mark incoming messages as seen
      messages.forEach((msg) => {
        if (msg.senderId !== user._id && msg.status !== 'seen') {
          const msgRef = doc(db, 'messages', msg._id);
          batch.update(msgRef, { status: 'seen' });
          updatedCount++;
          
          // Check if this msg is the last message of the conversation
          if (msg.text === selectedChat.lastMessage?.text && msg.senderId === selectedChat.lastMessage?.senderId) {
            shouldUpdateLastMessageStatus = true;
          }
        }
      });

      // 2. Clear unread count and update last message status in the conversation
      const convRef = doc(db, 'conversations', selectedChat._id);
      const convUpdates = {
        [`unreadCounts.${user._id}`]: 0
      };

      if (shouldUpdateLastMessageStatus) {
        convUpdates['lastMessage.status'] = 'seen';
      }

      // We always perform the update to the conversation to ensure unreadCounts are reset to 0
      // even if no specific message was marked seen in this pass (defensive)
      batch.update(convRef, convUpdates);

      if (updatedCount > 0 || shouldUpdateLastMessageStatus) {
        try {
          await batch.commit();
        } catch (err) {
          console.error("Error marking as seen:", err);
        }
      }
    };

    // Use a small timeout to avoid double updates on rapid message receipt
    const timeout = setTimeout(markAsSeen, 500);
    return () => clearTimeout(timeout);
  }, [messages, selectedChat?._id, user?._id, selectedChat?.lastMessage]);

  // Listener for other participant's status and privacy settings
  useEffect(() => {
    if (!selectedChat?.otherParticipant?._id) return;

    const otherUserRef = doc(db, 'users', selectedChat.otherParticipant._id);
    const unsubscribe = onSnapshot(otherUserRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOtherUserStatus(data.status || 'offline');
        setOtherUserLastSeenPrivacy(data.lastSeenPrivacy || 'everyone');
      }
    });

    return () => unsubscribe();
  }, [selectedChat?.otherParticipant?._id]);

  // Helper: determine if we can show the other user's status
  const canShowStatus = otherUserLastSeenPrivacy !== 'nobody';

  useEffect(() => {
    if (messages.length > 0) {
        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?._id || !selectedChat?._id) return;
    
    const text = newMessage;
    setNewMessage('');
    setError(null);

    // 1. Optimistic Update: Add message to local state immediately
    const tempId = Date.now().toString();
    const optimisticMsg = {
        _id: tempId,
        conversationId: selectedChat._id,
        senderId: user._id,
        senderName: user.username,
        senderAvatar: user.avatar,
        text: text,
        createdAt: new Date().toISOString(),
        status: 'sending' 
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const otherId = selectedChat.participantIds?.find(id => id !== user._id);
      
      const msgData = {
        conversationId: selectedChat._id,
        senderId: user._id,
        senderName: user.username,
        senderAvatar: user.avatar,
        text: text,
        createdAt: serverTimestamp(),
        status: 'sent' // Initial status
      };
      await addDoc(collection(db, 'messages'), msgData);

      const convRef = doc(db, 'conversations', selectedChat._id);
      
      const convUpdate = {
        lastMessage: {
          text: text,
          senderId: user._id,
          createdAt: serverTimestamp(),
          status: 'sent'
        },
        updatedAt: serverTimestamp()
      };

      // Atomic increment for unread count
      if (otherId) {
        // If unreadCounts object doesn't exist at all, we initialize it
        if (!selectedChat.unreadCounts) {
          convUpdate.unreadCounts = {
            [user._id]: 0,
            [otherId]: 1
          };
        } else {
          convUpdate[`unreadCounts.${otherId}`] = increment(1);
        }
      }

      await updateDoc(convRef, convUpdate);

    } catch (err) {
      console.error("Error sending message:", err);
      setError(`Send failed: ${err.message}`);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(text); // Restore message text
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files are supported.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview({ file, dataUrl: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendImage = async () => {
    if (!imagePreview?.file || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const otherId = selectedChat.participantIds?.find(id => id !== user._id);
      const storageRef = ref(storage, `chat-images/${selectedChat._id}/${Date.now()}_${imagePreview.file.name}`);
      const task = uploadBytesResumable(storageRef, imagePreview.file);
      task.on('state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => { console.error(err); setError('Upload failed.'); setUploading(false); },
        async () => {
          const imageUrl = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db, 'messages'), {
            conversationId: selectedChat._id,
            senderId: user._id,
            senderName: user.username,
            senderAvatar: user.avatar,
            text: newMessage.trim() || '',
            imageUrl,
            createdAt: serverTimestamp(),
            status: 'sent'
          });
          
          const convRef = doc(db, 'conversations', selectedChat._id);
          const convUpdate = {
            lastMessage: { text: '📷 Photo', senderId: user._id, createdAt: serverTimestamp(), status: 'sent' },
            updatedAt: serverTimestamp()
          };

          if (otherId) {
            // If unreadCounts object doesn't exist at all, we initialize it
            if (!selectedChat.unreadCounts) {
              convUpdate.unreadCounts = {
                [user._id]: 0,
                [otherId]: 1
              };
            } else {
              convUpdate[`unreadCounts.${otherId}`] = increment(1);
            }
          }

          await updateDoc(convRef, convUpdate);
          setImagePreview(null);
          setNewMessage('');
          setUploading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setError('Upload failed.');
      setUploading(false);
    }
  };

  const otherParticipant = selectedChat?.otherParticipant;

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear all messages from this chat? This cannot be undone.")) return;
    
    try {
      setLoading(true);
      const q = query(collection(db, 'messages'), where('conversationId', '==', selectedChat._id));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Update last message in conversation
      const convRef = doc(db, 'conversations', selectedChat._id);
      await updateDoc(convRef, {
        lastMessage: null,
        updatedAt: serverTimestamp(),
        unreadCounts: {} // Reset all counts
      });
      
      setMessages([]);
      setLoading(false);
    } catch (err) {
      console.error("Purge failure:", err);
      setError("Purge failed. Connection unstable.");
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user?._id || !otherParticipant?._id) return;
    
    const isCurrentlyBlocked = user.blockedUsers?.includes(otherParticipant._id);
    const updatedBlockedUsers = isCurrentlyBlocked 
        ? user.blockedUsers.filter(id => id !== otherParticipant._id)
        : [...(user.blockedUsers || []), otherParticipant._id];

    try {
      await updateDoc(doc(db, 'users', user._id), {
        blockedUsers: updatedBlockedUsers
      });
    } catch (err) {
      console.error("Profile update failure:", err);
      setError("Profile update failed.");
    }
  };

  const handleSelectTheme = async (themeId) => {
    try {
      // Update the user's default theme globally
      await updateSettings({ defaultTheme: themeId });
      
      // If the current chat has a specific theme, clear it so it inherits the global theme
      if (selectedChat?.theme) {
          const convRef = doc(db, 'conversations', selectedChat._id);
          await updateDoc(convRef, { theme: null });
      }

      setIsThemeSelectorOpen(false);
    } catch (err) {
      console.error("Theme shift failure:", err);
      setError("Theme update failed.");
    }
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 relative border border-white/5 shadow-2xl overflow-hidden p-6">
            <div className="absolute inset-0 bg-neo-cyan/10 blur-3xl animate-pulse" />
            <Logo className="w-full h-full text-neo-text drop-shadow-xl relative z-10" />
          </div>
          <h3 className="text-4xl font-black text-neo-text-dim mb-6 tracking-tighter uppercase">Cosmify</h3>
          <p className="text-neo-text-dim text-sm leading-relaxed opacity-60 font-medium tracking-widest uppercase">
            Enjoy cosmic level communication
          </p>
          <div className="mt-12 flex items-center gap-3 px-6 py-2 rounded-full bg-neo-surface border border-neo-border">
            <div className="w-2 h-2 bg-neo-secondary rounded-full" />
            <span className="text-[10px] font-bold text-neo-secondary uppercase tracking-[0.2em]">Verified Secure</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-neo-bg">
      {/* Doodle Pattern Overlay */}
      <div className="doodle-bg" />
      
      {/* Group Info Drawer */}
      <GroupInfoDrawer isOpen={isGroupInfoOpen} onClose={() => setIsGroupInfoOpen(false)} />

      {/* Visual Overlay for Consistency */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      
      {/* Floating Header */}
      <div className="h-[70px] md:h-[90px] px-4 md:px-8 py-2 flex items-center justify-between z-30 border-b border-neo-border bg-neo-surface backdrop-blur-xl">
        <div 
          onClick={() => selectedChat?.isGroup ? setIsGroupInfoOpen(true) : setIsContactDrawerOpen(true)}
          className="flex items-center gap-3 md:gap-5 flex-1 group cursor-pointer"
        >
          {/* Back Button for Mobile Navigation */}
          <button 
            onClick={(e) => {
                e.stopPropagation(); // Prevent opening drawer when clicking back
                setSelectedChat(null);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-neo-surface text-neo-text lg:hidden transition-colors"
            title="Return to Chats"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="relative">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-neo-border relative z-10">
                <img 
                src={
                  selectedChat?.isGroup
                    ? selectedChat.groupAvatar
                    : (otherParticipant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.username}`)
                } 
                alt="Identity" 
                className="w-full h-full object-cover" 
                />
            </div>
          </div>
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-[16px] md:text-[18px] text-neo-text tracking-tight truncate">
                {selectedChat?.isGroup
                  ? selectedChat.groupName
                  : (otherParticipant?.username || (otherParticipant?.phone ? `Number: ${otherParticipant.phone}` : 'Unknown'))}
                </h4>
              {!selectedChat?.isGroup && canShowStatus && otherUserStatus === 'online' && (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neo-secondary rounded-full" />
                )}
            </div>
            {selectedChat?.isGroup ? (
              <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neo-text-dim">
                {selectedChat.participantIds?.length || 0} members
              </span>
            ) : canShowStatus ? (
              <span className={`text-[10px] md:text-[12px] font-bold uppercase tracking-widest transition-colors ${otherUserStatus === 'online' ? 'text-neo-secondary' : 'text-neo-text-dim'}`}>
                  {otherUserStatus}
              </span>
            ) : (
              <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neo-text-dim/40">
                Last seen hidden
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button className="neo-btn-icon !p-1.5 md:!p-2" title="Scan Link">
            <Search size={18} className="md:w-[22px] md:h-[22px] opacity-80" />
          </button>
          <ChatMenu 
            onViewProfile={() => setIsContactDrawerOpen(true)}
            onOpenTheme={() => setIsThemeSelectorOpen(true)}
            onClearChat={handleClearChat}
            onBlockUser={handleBlockUser}
            isBlocked={isBlocked}
          />
        </div>
      </div>

      {/* Futuristic Message Feed (Centered) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 z-10 custom-scrollbar relative">
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="sticky top-4 left-0 right-0 z-50 flex justify-center">
            <div className="bg-neo-pink text-white px-6 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md">
              {error}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
          <AnimatePresence initial={false}>
            {messages.map((m, index) => {
              const messageDate = new Date(m.createdAt).toLocaleDateString();
              const prevMessageDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString() : null;
              const showDateSeparator = messageDate !== prevMessageDate;

              const formatHeaderDate = (dateStr) => {
                const date = new Date(dateStr);
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                if (date.toLocaleDateString() === today.toLocaleDateString()) return 'Today';
                if (date.toLocaleDateString() === yesterday.toLocaleDateString()) return 'Yesterday';
                return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
              };

              return (
                <React.Fragment key={m._id}>
                  {showDateSeparator && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center my-6"
                    >
                      <span className="px-4 py-1.5 rounded-full neo-glass text-[10px] md:text-[11px] font-bold text-neo-text uppercase tracking-[0.2em] border border-neo-border">
                        {formatHeaderDate(m.createdAt)}
                      </span>
                    </motion.div>
                  )}
                  <MessageItem message={m} isOwn={m.senderId === user._id} />
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
        <div ref={scrollRef} className="h-20 md:h-4" />
      </div>

      {/* Floating Input Capsule Orb */}
      <div className="p-4 md:p-8 md:pb-10 z-20">

        {/* Image Preview Strip */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-4xl mx-auto mb-3 flex items-end gap-3 bg-neo-surface border border-neo-border rounded-3xl p-3"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={imagePreview.dataUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-2xl object-cover border border-neo-border"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neo-pink text-white flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neo-text-dim truncate">{imagePreview.file.name}</p>
                {uploading && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-neo-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neo-primary rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neo-primary font-bold mt-1">{uploadProgress}% uploading…</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={sendImage}
                disabled={uploading}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-neo-primary flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-neo-cyan/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative neo-glass rounded-full flex items-center p-1.5 md:p-2 pl-4 md:pl-6 gap-2 md:gap-3 group-focus-within:border-neo-cyan/40 transition-all">
            <div className="flex items-center gap-1 md:gap-2">
                <button type="button" className="neo-btn-icon !p-1 md:!p-1.5 opacity-50 hover:opacity-100" title="Neural Emoji">
                <Smile size={18} md:size={20} />
                </button>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-btn-icon !p-1 md:!p-1.5 opacity-50 hover:opacity-100"
                  title="Upload Photo"
                >
                <Paperclip size={18} md:size={20} />
                </button>
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isBlocked}
              placeholder={isBlocked ? "Contact Blocked..." : "Type a message..."}
              className={`flex-1 bg-transparent border-none outline-none py-2 md:py-3 text-[14px] md:text-[15px] text-neo-text placeholder:text-neo-text-dim font-light ${isBlocked ? 'opacity-30' : ''}`}
            />
            {newMessage.trim() && !isBlocked ? (
                <button 
                type="submit" 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-neo-primary text-white cursor-pointer hover:bg-neo-primary/90"
                >
                <Send size={18} md:size={20} />
                </button>
            ) : (
                <button 
                type="button" 
                disabled={isBlocked}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 scale-90 hover:scale-100 active:scale-95 bg-white/5 text-neo-cyan/60 hover:text-neo-cyan ${isBlocked ? 'cursor-not-allowed opacity-20' : 'cursor-pointer'}`}
                >
                <Mic size={18} md:size={20} />
                </button>
            )}
          </div>
        </form>
      </div>

      {/* Contact Profile Drawer */}
      <ContactDrawer 
        isOpen={isContactDrawerOpen} 
        onClose={() => setIsContactDrawerOpen(false)} 
        contact={otherParticipant}
      />

      {/* Theme Selector Modal */}
      <ThemeSelector 
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentTheme={chatTheme}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
};

export default ChatBox;
