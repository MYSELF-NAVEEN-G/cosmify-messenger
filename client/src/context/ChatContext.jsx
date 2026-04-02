import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

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
