import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatPage from './pages/ChatPage';
import ProfileSetup from './pages/ProfileSetup';
import SplashScreen from './components/SplashScreen';
import { useChat } from './context/ChatContext';

const App = () => {
  const { user, loading, selectedChat } = useChat();

  if (loading) return <SplashScreen />;

  const activeThemeId = selectedChat?.theme || user?.defaultTheme || 'default';

  return (
    <div className={`h-screen w-screen bg-neo-bg text-neo-text overflow-hidden relative selection:bg-neo-primary/30`}>
      {/* Background Layer (Clean) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-neo-bg" />

      <div className="relative z-10 h-full w-full">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={!user ? <Login /> : (user.profileComplete ? <Navigate to="/chat" /> : <Navigate to="/profile-setup" />)} />
          <Route path="/signup" element={<Navigate to="/login" />} />
          
          {/* Onboarding Route */}
          <Route 
            path="/profile-setup" 
            element={user ? (user.profileComplete ? <Navigate to="/chat" /> : <ProfileSetup />) : <Navigate to="/login" />} 
          />

          {/* Main App Route */}
          <Route 
            path="/chat" 
            element={user ? (user.profileComplete ? <ChatPage /> : <Navigate to="/profile-setup" />) : <Navigate to="/login" />} 
          />
          
          {/* Default Redirects */}
          <Route path="*" element={<Navigate to={user ? (user.profileComplete ? "/chat" : "/profile-setup") : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
