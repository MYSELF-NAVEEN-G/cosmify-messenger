import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

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

  // State Synchronization: Keep selectedChat in sync with the live chats array 
  // from Firestore to ensure all components see the most current data instantly.
  useEffect(() => {
    if (!selectedChat?._id || chats.length === 0) return;
    
    const updatedChat = chats.find(c => c._id === selectedChat._id);
    if (updatedChat) {
      // Only update if the data has actually changed to avoid infinite loops
      const hasChanged = JSON.stringify(updatedChat) !== JSON.stringify(selectedChat);
      if (hasChanged) {
        console.log(`[SyncEngine] Refreshing selectedChat: ${selectedChat._id}`);
        setSelectedChat(updatedChat);
      }
    }
  }, [chats, selectedChat?._id]);

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
    
    // Set to online (using setDoc with merge for robustness on first-time logins)
    setDoc(userRef, { status: 'online' }, { merge: true }).catch(console.error);

    const handlePresence = () => {
      // Offline update handled here
      setDoc(userRef, { status: 'offline' }, { merge: true }).catch(console.error);
    };

    window.addEventListener('beforeunload', handlePresence);
    return () => {
      window.removeEventListener('beforeunload', handlePresence);
      handlePresence();
    };
  }, [user?._id]);

  const logout = async () => {
    try {
      if (user?._id) {
        await setDoc(doc(db, 'users', user._id), { status: 'offline' }, { merge: true });
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
