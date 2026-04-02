import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, getDoc } from 'firebase/firestore';
import NotificationService from '../utils/NotificationService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);

  useEffect(() => {
    let unsubUser = null;
    let unsubAuth = null;

    const init = async () => {
      // 1. Handle redirect result BEFORE starting the listener
      try {
        await getRedirectResult(auth);
      } catch (err) {
        console.error("Auth redirect error:", err);
      }

      // 2. Start the auth state listener
      unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        // Cleanup previous user listener if it exists
        if (unsubUser) {
          unsubUser();
          unsubUser = null;
        }

        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          // 3. Start a fresh listener for the current user's profile
          unsubUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUser({ 
                ...firebaseUser, 
                ...userData, 
                _id: firebaseUser.uid,
                profileComplete: !!userData.phone 
              });
            } else {
              // Document doesn't exist yet (new account)
              setUser({ 
                ...firebaseUser, 
                _id: firebaseUser.uid, 
                profileComplete: false 
              });
            }
            setLoading(false);
          }, (error) => {
            console.error("User listener error:", error);
            setUser({ ...firebaseUser, _id: firebaseUser.uid, profileComplete: false });
            setLoading(false);
          });
        } else {
          setUser(null);
          setLoading(false);
        }
      });
    };

    init();

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Theme application: Apply theme class to document.body
  useEffect(() => {
    // Priority: 1. Selected Chat Theme, 2. User Default Theme, 3. 'default'
    const activeThemeId = selectedChat?.theme || user?.defaultTheme || 'default';
    const themeClass = `theme-${activeThemeId}`;
    
    // Remove all existing theme classes to avoid stacking
    const currentClasses = Array.from(document.body.classList);
    currentClasses.forEach(c => {
      if (c.startsWith('theme-')) document.body.classList.remove(c);
    });
    
    // Add the active theme class
    document.body.classList.add(themeClass);
    
    // Debug log to trace theme shifts
    console.log(`[ThemeEngine] Applied: ${themeClass}`);
  }, [selectedChat?.theme, user?.defaultTheme, user?._id]);

  // Presence logic: Update status to online/offline
  useEffect(() => {
    if (!user?._id) return;

    const userRef = doc(db, 'users', user._id);
    
    // Set to online
    updateDoc(userRef, { status: 'online' }).catch(console.error);

    const handlePresence = () => {
      // Offline update handled here
      updateDoc(userRef, { status: 'offline' }).catch(console.error);
    };

    window.addEventListener('beforeunload', handlePresence);
    return () => {
      window.removeEventListener('beforeunload', handlePresence);
      handlePresence();
    };
  }, [user?._id]);

  // 4. Global notification listener for ANY conversation update
  useEffect(() => {
    if (!user?._id) return;

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user._id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const lastMsg = data.lastMessage;
          
          // Only notify if:
          // 1. New message exists
          // 2. Message is NOT FROM current user
          // 3. Message is NOT in the currently active chat
          // 4. App settings allow notifications (optional: check user prefs)
          if (lastMsg && lastMsg.senderId !== user._id && selectedChat?._id !== change.doc.id) {
             const soundOnly = user.notificationSettings?.soundOnly || false;
             const muted = user.notificationSettings?.muted || false;

             if (!muted) {
                NotificationService.playSound();
                if (!soundOnly) {
                   NotificationService.sendNotification(lastMsg.senderName || 'New Message', {
                     body: lastMsg.text,
                     tag: change.doc.id // Group notifications by chat
                   });
                }
             }
          }
        }
      });
    }, (err) => console.error("Global alert listener error:", err));

    return () => unsubscribe();
  }, [user?._id, selectedChat?._id, user.notificationSettings]);

  // Request notification permissions on mount
  useEffect(() => {
    if (user?._id) {
        NotificationService.requestPermission();
    }
  }, [user?._id]);

  const logout = async () => {
    try {
      if (user?._id) {
        await updateDoc(doc(db, 'users', user._id), { status: 'offline' });
      }
      await signOut(auth);
      setSelectedChat(null);
      setChats([]);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        loading,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        notificationSettings: user?.notificationSettings || { muted: false, soundOnly: false },
        updateSettings: async (settings) => {
          if (!user?._id) return;
          // Optimistically update local state for immediate feedback
          setUser(prev => ({ ...prev, ...settings }));
          try {
            await updateDoc(doc(db, 'users', user._id), settings);
          } catch (err) {
            console.error("Update settings failure:", err);
          }
        },
        logout
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
