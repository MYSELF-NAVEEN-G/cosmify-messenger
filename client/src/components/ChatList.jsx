import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { Search, Plus, Filter, Phone, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatList = () => {
  const { chats, setChats, setSelectedChat, selectedChat, user } = useChat();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user._id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // 1. Map documents and fetch other participant details
      const allChats = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();

        if (data.isGroup) {
          // Group chat — no single "other participant"
          return { _id: chatDoc.id, ...data, isGroup: true };
        }

        const otherId = data.participantIds?.find(id => id !== user._id);
        if (!otherId) return null;
        const otherDoc = await getDoc(doc(db, 'users', otherId));
        
        return {
          _id: chatDoc.id,
          ...data,
          otherParticipant: otherDoc.exists() ? { ...otherDoc.data(), _id: otherId } : null
        };
      }));

      // Filter nulls, then deduplicate non-group chats
      const validChats = allChats.filter(Boolean);
      const uniqueChats = [];
      const seenParticipants = new Set();

      validChats.forEach(chat => {
        if (chat.isGroup) {
          uniqueChats.push(chat);
          return;
        }
        const otherId = chat.participantIds?.find(id => id !== user._id);
        if (otherId && !seenParticipants.has(otherId)) {
          seenParticipants.add(otherId);
          uniqueChats.push(chat);
        }
      });

      setChats(uniqueChats);
    }, (error) => {
      console.error("Error fetching chats:", error);
    });

    return () => unsubscribe();
  }, [user?._id, setChats]);

  const handleSearch = async (queryText) => {
    const cleanText = queryText.replace(/\D/g, ''); // Only numbers
    setSearch(cleanText);
    
    if (cleanText.length !== 10) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      // Search exactly by the 10-digit Messaging ID (phone)
      const q = query(usersRef, where('phone', '==', cleanText));
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ ...doc.data(), _id: doc.id }))
        .filter(u => u._id !== user._id);
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetUser) => {
    try {
      // 1. Check local state FIRST (much faster)
      const existing = chats.find(c => c.participantIds.includes(targetUser._id));
      if (existing) {
        setSelectedChat(existing);
        setSearch('');
        setSearchResults([]);
        return;
      }

      // 2. Double check on server if not found locally
      const chatsRef = collection(db, 'conversations');
      const q = query(chatsRef, where('participantIds', 'array-contains', user._id));
      const snapshot = await getDocs(q);
      
      let existingChatDoc = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participantIds.includes(targetUser._id)) {
          existingChatDoc = { _id: doc.id, ...data, otherParticipant: targetUser };
        }
      });

      if (existingChatDoc) {
        setSelectedChat(existingChatDoc);
      } else {
        // 3. Create new conversation ONLY if it truly doesn't exist
        const newChat = {
          participantIds: [user._id, targetUser._id],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: { 
            text: "Tap to start chatting", 
            senderId: "system",
            createdAt: serverTimestamp() 
          },
          unreadCounts: {
            [user._id]: 0,
            [targetUser._id]: 0
          }
        };
        const docRef = await addDoc(collection(db, 'conversations'), newChat);
        setSelectedChat({ _id: docRef.id, ...newChat, otherParticipant: targetUser });
      }
      
      setSearch('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert("Could not start chat. Please check your internet or Firebase indexes.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Bar Container */}
      <div className="px-6 py-6 border-b border-neo-border">
        <div className="relative group">
          <div className="relative flex items-center h-[46px] bg-neo-surface border border-neo-border rounded-full px-4 group-focus-within:border-neo-primary transition-all">
            <Search 
              size={18} 
              className="text-neo-text-dim group-focus-within:text-neo-primary transition-colors" 
            />
            <input
              type="text"
              value={search}
              maxLength="10"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by phone number..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-4 py-1.5 text-[14px] text-neo-text placeholder:text-neo-text-dim font-light"
            />
          </div>
        </div>
      </div>

      {/* Results or Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {search.length > 0 ? (
            // ... (Search Results)
            search.length === 10 && (
              loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-neo-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleStartChat(u)}
                    className="flex items-center gap-4 px-4 py-3 bg-neo-surface border border-neo-border rounded-2xl hover:border-neo-primary/40 cursor-pointer group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neo-border group-hover:border-neo-primary transition-all">
                      <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] text-neo-text truncate">{u.username}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-neo-text-dim font-bold uppercase tracking-widest">
                        <Phone size={10} /> {u.phone}
                      </div>
                    </div>
                    <Plus size={20} className="text-neo-primary opacity-40 group-hover:opacity-100" />
                  </motion.div>
                ))
              ) : null
            )
          ) : (
            chats.map((chat) => {
              const other = chat.otherParticipant;
              const isSelected = selectedChat?._id === chat._id;
              
              return (
                <motion.div
                  key={chat._id}
                  layout
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                    isSelected 
                        ? 'bg-neo-primary/10 border-neo-primary/30' 
                        : 'hover:bg-neo-surface border border-transparent'
                  }`}
                >
                  {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neo-primary" />
                  )}

                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-neo-surface flex-shrink-0 group-hover:border-neo-purple/40 transition-colors">
                    <img 
                      src={chat.isGroup
                        ? chat.groupAvatar
                        : (other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`)}
                      alt="Identity" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-semibold text-[15px] truncate transition-colors ${isSelected ? 'text-neo-text' : 'text-neo-text-dim'}`}>
                        {chat.isGroup
                          ? chat.groupName
                          : (other?.username || (other?.phone ? `ID: ${other.phone}` : 'Unknown Agent'))}
                      </h4>
                      <span className={`text-[10px] font-bold tracking-tighter ${isSelected ? 'text-neo-text' : 'text-neo-text-dim'}`}>
                        {chat.updatedAt ? new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {chat.lastMessage?.senderId === user._id && (
                        <div className="flex-shrink-0">
                          {chat.lastMessage?.status === 'sending' ? (
                            <Clock size={10} className="text-neo-primary" />
                          ) : (
                            <CheckCheck size={12} className="text-neo-secondary" />
                          )}
                        </div>
                      )}
                      <p className="text-[13px] text-neo-text-dim truncate font-light opacity-70 group-hover:opacity-100 transition-opacity">
                        {chat.lastMessage?.text || 'Signal established...'}
                      </p>
                    </div>
                  </div>

                  {/* Unread Count Badge */}
                  {chat.unreadCounts?.[user._id] > 0 && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex-shrink-0 min-w-[22px] h-[22px] bg-neo-primary text-black text-[10px] font-black rounded-full flex items-center justify-center px-1.5 shadow-[0_0_15px_rgba(var(--neo-primary-rgb),0.4)] animate-pulse"
                      >
                        {chat.unreadCounts[user._id]}
                      </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatList;
