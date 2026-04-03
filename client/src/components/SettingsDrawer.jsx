import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Check, 
  Pencil, 
  RotateCcw, 
  LogOut, 
  Search, 
  Key, 
  Lock, 
  Users, 
  MessageSquare, 
  Megaphone, 
  Bell, 
  Circle, 
  Accessibility, 
  Globe,
  ChevronRight,
  ShieldCheck,
  UserX,
  Palette,
  Sun, 
  Moon, 
  Image as ImageIcon, 
  Palette as PaletteIcon,
  CornerDownRight,
  Download,
  Zap,
  User,
  Shield,
  Activity,
  Cpu,
  Gem,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { themes } from './ThemeSelector';
import UPIPaymentModal from './UPIPaymentModal';
import { isNumberUnique } from '../utils/NumberGenerator';

const SettingsItem = ({ icon: Icon, title, description, onClick, rightElement }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-6 px-6 py-4 hover:bg-neo-surface transition-colors group text-left"
  >
    <div className="text-neo-text-dim group-hover:text-neo-purple transition-colors">
      <Icon size={22} strokeWidth={1.5} />
    </div>
    <div className="flex-1 border-b border-neo-border pb-4 group-last:border-none flex items-center justify-between">
      <div>
        <h3 className="text-[16px] text-neo-text font-medium tracking-tight mb-0.5">{title}</h3>
        <p className="text-[13px] text-neo-text-dim font-light leading-tight pr-4">{description}</p>
      </div>
      {rightElement || <ChevronRight size={18} className="text-neo-text-dim/20 group-hover:text-neo-text-dim/50 transition-colors" />}
    </div>
  </button>
);

const SettingsDrawer = ({ isOpen, onClose }) => {
  const { user, logout, updateSettings } = useChat();
  const [view, setView] = useState('main'); // main, profile, account, privacy, chats, features
  const [name, setName] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || 'Available');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const fileInputRef = React.useRef();
  
  // Account settings
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(user?.secondaryPhone || '');
  const [isEditingSecondary, setIsEditingSecondary] = useState(false);
  const [secondaryError, setSecondaryError] = useState('');
  
  // Blocked users data
  const [blockedUserDetails, setBlockedUserDetails] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.username || '');
      setAvatar(user.avatar || '');
      setBio(user.bio || 'Available');
      setNewPhone(user.phone || '');
      setSecondaryPhone(user.secondaryPhone || '');
    }

    // Check if app can be installed as PWA
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      setIsIOS(iOS);

      // Show install option if not standalone
      if (!isStandalone) {
        if (window.deferredPrompt || iOS) {
          setCanInstall(true);
        }
      }
    };

    checkInstallation();
    const handlePrompt = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [user]);

  // Fetch blocked users details when entering Privacy view
  useEffect(() => {
    if (view === 'privacy' && user?.blockedUsers?.length > 0) {
      const fetchBlockedDetails = async () => {
        const details = await Promise.all(
          user.blockedUsers.map(async (uid) => {
            const docSnap = await getDoc(doc(db, 'users', uid));
            return docSnap.exists() ? { id: uid, ...docSnap.data() } : { id: uid, username: 'Unknown User' };
          })
        );
        setBlockedUserDetails(details);
      };
      fetchBlockedDetails();
    } else {
      setBlockedUserDetails([]);
    }
  }, [view, user?.blockedUsers]);

  const handleLogout = async () => {
    try {
      setConfirmLogout(false);
      onClose();
      await logout();
    } catch (err) {
      console.error("Logout failure:", err);
    }
  };

  const handleUpdateField = async (field, value) => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user._id), { [field]: value });
      if (field === 'username') setIsEditingName(false);
      if (field === 'bio') setIsEditingBio(false);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (uid) => {
    try {
        const updatedBlocked = user.blockedUsers.filter(id => id !== uid);
        await updateDoc(doc(db, 'users', user._id), { blockedUsers: updatedBlocked });
    } catch (err) {
        console.error("Error unblocking:", err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?._id) return;

    setIsUploadingAvatar(true);
    setAvatarUploadProgress(0);

    try {
      const storageRef = ref(storage, `avatars/${user._id}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setAvatarUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setIsUploadingAvatar(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'users', user._id), { avatar: downloadURL });
          setAvatar(downloadURL);
          setIsUploadingAvatar(false);
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      setIsUploadingAvatar(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (!user?._id) return;
    try {
       await updateDoc(doc(db, 'users', user._id), {
          isPremium: true,
          paymentUTR: paymentData.utr
       });
       setIsPaymentModalOpen(false);
       // Refresh via context or local state as needed
    } catch (err) {
       console.error("Payment confirmation failed:", err);
    }
  };

  const handleInstallApp = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;

    // Show the install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    window.deferredPrompt = null;
    setCanInstall(false);
  };

  const renderHeader = (title, backTo = 'main') => (
    <div className="h-[108px] bg-neo-surface flex items-end p-6 pb-6 border-b border-neo-border">
      <div className="flex items-center gap-6 text-neo-text w-full">
        <button 
          onClick={() => backTo === 'close' ? onClose() : setView(backTo)} 
          className="hover:bg-neo-text/5 p-2 rounded-full transition-colors text-neo-text"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-black uppercase italic tracking-tighter text-neo-text flex-1">{title}</h2>
        {view === 'main' && (
             <button className="p-2 hover:bg-neo-surface rounded-full transition-colors text-neo-text-dim">
                <Search size={22} strokeWidth={1.5} />
            </button>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-neo-bg flex flex-col shadow-2xl overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {/* VIEW: MAIN SETTINGS */}
        {view === 'main' && (
          <motion.div 
            key="main" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="flex-1 h-full flex flex-col"
          >
            {renderHeader('Settings', 'close')}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-4 pb-20 overscroll-behavior-y-contain">
              <button onClick={() => setView('profile')} className="w-full flex items-center gap-5 px-6 py-6 hover:bg-neo-surface transition-colors group mb-4 border-b border-neo-border">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neo-purple/40 shadow-[0_0_15px_rgba(138,43,226,0.2)]">
                  <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-[18px] text-neo-text font-bold tracking-tight">{user?.username}</h3>
                  <p className="text-[13px] text-neo-text-dim font-light truncate max-w-[200px]">{user?.bio || 'Available'}</p>
                </div>
                <ChevronRight size={20} className="text-neo-text-dim group-hover:text-neo-purple transition-colors" />
              </button>

              <div className="flex flex-col">
                <SettingsItem icon={Key} title="Account" description="Security notifications, permanent identity" onClick={() => setView('account')} />
                <SettingsItem icon={Lock} title="Privacy" description="Block contacts, disappearing messages" onClick={() => setView('privacy')} />
                <SettingsItem icon={Users} title="Features" description="Manage people and groups" onClick={() => setView('features')} />
                <SettingsItem icon={MessageSquare} title="Chats" description="Theme, wallpapers, chat history" onClick={() => setView('chats')} />
                
                {canInstall && (
                  <div className="mt-4 px-6 mb-4">
                    <div className="p-6 rounded-3xl bg-neo-primary/10 border border-neo-primary/30 space-y-4 shadow-[0_0_20px_rgba(var(--neo-primary-rgb),0.05)]">
                      <div className="flex items-center gap-4 text-neo-primary">
                          <Download size={24} />
                          <h3 className="font-bold text-neo-text tracking-widest uppercase text-xs">App Available</h3>
                      </div>
                      
                      {isIOS ? (
                        <p className="text-neo-text-dim text-[11px] leading-relaxed">
                          To install: Tap the <span className="text-neo-primary font-bold">Share</span> icon below and select <span className="text-neo-primary font-bold">"Add to Home Screen"</span>.
                        </p>
                      ) : (
                        <>
                          <p className="text-neo-text-dim text-[11px] leading-relaxed">Download Cosmify as a web app for a faster experience and offline access.</p>
                          <button 
                            onClick={handleInstallApp}
                            className="w-full py-3 bg-neo-primary text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neo-primary/20"
                          >
                            Install Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 px-6 pb-20">
                {!confirmLogout ? (
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-neo-pink/5 hover:bg-neo-pink/10 text-neo-pink rounded-2xl transition-all border border-neo-pink/20 hover:border-neo-pink/40 font-bold uppercase tracking-widest text-[11px] italic"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                ) : (
                  <div className="rounded-2xl border border-neo-pink/40 bg-neo-pink/10 p-4 space-y-3">
                    <p className="text-neo-pink text-xs font-bold text-center uppercase tracking-widest">Sign out of Cosmify?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmLogout(false)}
                        className="flex-1 py-2.5 rounded-xl border border-neo-border text-neo-text-dim text-xs font-bold uppercase tracking-widest hover:bg-neo-surface transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 py-2.5 rounded-xl bg-neo-pink text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: EDIT PROFILE */}
        {view === 'profile' && (
          <motion.div 
            key="profile" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            className="flex-1 h-full flex flex-col"
          >
            {renderHeader('Edit Profile')}
            <div className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar pb-24 overscroll-behavior-y-contain">
            <div className="relative group mb-10">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
                <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-neo-purple shadow-[0_0_30px_rgba(106,13,173,0.3)] bg-neo-surface relative">
                  <img src={avatar} alt="Profile" className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-30' : ''}`} />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-neo-purple border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-[10px] font-black text-neo-purple uppercase tracking-widest">{avatarUploadProgress}%</span>
                    </div>
                  )}
                </div>
                <div 
                  onClick={() => !isUploadingAvatar && fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  <Camera size={32} className="text-neo-purple mb-2" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Photo</span>
                </div>
                <button onClick={() => {
                  const newSeed = Math.random().toString(36).substring(7);
                  setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`);
                }} className="absolute bottom-2 right-2 p-3 bg-neo-purple rounded-full text-black shadow-lg hover:scale-110 transition-all z-20">
                  <RotateCcw size={20} />
                </button>
                
                {user?.isBanned ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-neo-bg z-30"
                  >
                    <UserX size={12} fill="white" />
                    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Account Banned</span>
                  </motion.div>
                ) : user?.isPremium && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-neo-bg z-30"
                  >
                    <CheckCircle2 size={12} fill="white" />
                    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Verified User</span>
                  </motion.div>
                )}
              </div>
              {avatar !== user?.avatar && (
                  <button onClick={() => handleUpdateField('avatar', avatar)} disabled={loading} className="mb-8 px-8 py-3 bg-neo-purple text-black rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(106,13,173,0.4)] hover:scale-105 disabled:opacity-50 transition-all font-sans">
                    {loading ? 'Updating...' : 'Confirm Photo Change'}
                  </button>
              )}
              <div className="w-full space-y-12">
                <div className="space-y-4">
                  <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">Name</label>
                  <div className="flex items-center justify-between border-b border-neo-border pb-2">
                    {isEditingName ? <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus className="flex-1 bg-transparent border-none outline-none text-neo-text text-[16px] font-light" /> : <span className="text-[16px] text-neo-text font-light">{user?.username}</span>}
                    <button onClick={() => isEditingName ? handleUpdateField('username', name) : setIsEditingName(true)} className="text-neo-purple ml-2">
                      {isEditingName ? <Check size={20} /> : <Pencil size={18} className="opacity-40 hover:opacity-100" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">About / Bio</label>
                  <div className="flex items-center justify-between border-b border-neo-border pb-2">
                    {isEditingBio ? (
                      <input 
                        type="text" 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        autoFocus 
                        className="flex-1 bg-transparent border-none outline-none text-neo-text text-[16px] font-light" 
                      />
                    ) : (
                      <span className="text-[16px] text-neo-text font-light">{user?.bio || 'Available'}</span>
                    )}
                    <button onClick={() => isEditingBio ? handleUpdateField('bio', bio) : setIsEditingBio(true)} className="text-neo-primary ml-2">
                      {isEditingBio ? <Check size={20} /> : <Pencil size={18} className="opacity-40 hover:opacity-100" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1">Phone Number</label>
                  <div className="flex items-center justify-between border-b border-neo-border pb-2 opacity-60">
                    <span className="text-[16px] text-neo-text font-mono tracking-widest">{user?.phone}</span>
                    <Lock size={16} className="text-neo-text-dim" />
                  </div>
                </div>
              </div>

              <div className="mt-12 w-full">
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-3 py-4 bg-neo-pink/5 hover:bg-neo-pink/10 text-neo-pink rounded-2xl transition-all border border-neo-pink/20 hover:border-neo-pink/40 font-bold uppercase tracking-widest text-[11px] italic"
                >
                  <LogOut size={18} /> Sign Out of Cosmify
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: ACCOUNT */}
        {view === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col">
            {renderHeader('Account')}
            <div className="p-8 space-y-8">
              <div className="p-6 rounded-3xl bg-neo-surface border border-neo-border space-y-4">
                <div className="flex items-center gap-4 text-neo-purple mb-2">
                    <ShieldCheck size={24} />
                    <h3 className="font-bold text-neo-text tracking-widest uppercase text-xs">Security Verified</h3>
                </div>
                <p className="text-neo-text-dim text-xs leading-relaxed">Your account is secured with end-to-end neural encryption. 2FA is active on your frequency.</p>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-neo-surface/40 border border-neo-border italic text-[13px] text-neo-text-dim text-center">
                  Your Phone Number is your unique, permanent identity in Cosmify. It cannot be modified.
                </div>

                {user?.phone === '1111111111' && (
                  <div className="p-6 rounded-[32px] bg-neo-primary/5 border border-neo-primary/20 space-y-4">
                    <div className="flex items-center gap-3 text-neo-primary">
                        <Zap size={20} />
                        <h3 className="font-black text-neo-text tracking-[0.2em] uppercase text-[10px]">Admin Secondary Identity</h3>
                    </div>
                    
                    <div className="flex items-center justify-between border-b border-neo-border pb-3">
                        {isEditingSecondary ? (
                          <input 
                            type="text" 
                            maxLength="10"
                            value={secondaryPhone} 
                            onChange={e => setSecondaryPhone(e.target.value.replace(/\D/g, ''))} 
                            autoFocus 
                            className="flex-1 bg-transparent border-none outline-none text-neo-text text-[18px] font-mono tracking-[0.2em]" 
                            placeholder="SET 10-DIGIT ID"
                          />
                        ) : (
                          <span className="text-[18px] text-neo-text font-mono tracking-[0.2em]">{user?.secondaryPhone || 'NOT CONFIGURED'}</span>
                        )}
                        <button 
                          onClick={async () => {
                            if (isEditingSecondary) {
                                setLoading(true);
                                if (secondaryPhone.length === 10) {
                                    const available = await isNumberUnique(secondaryPhone);
                                    if (available || secondaryPhone === user?.secondaryPhone) {
                                        await handleUpdateField('secondaryPhone', secondaryPhone);
                                        setIsEditingSecondary(false);
                                        setSecondaryError('');
                                    } else {
                                        setSecondaryError('ID ALREADY TAKEN');
                                    }
                                } else if (secondaryPhone === '') {
                                    await handleUpdateField('secondaryPhone', '');
                                    setIsEditingSecondary(false);
                                    setSecondaryError('');
                                } else {
                                    setSecondaryError('MUST BE 10 DIGITS');
                                }
                                setLoading(false);
                            } else {
                                setIsEditingSecondary(true);
                            }
                          }} 
                          className="text-neo-primary p-2 hover:bg-neo-primary/10 rounded-xl transition-all"
                        >
                          {isEditingSecondary ? <Check size={20} /> : <Pencil size={18} />}
                        </button>
                    </div>
                    
                    {secondaryError && (
                        <p className="text-[9px] text-neo-pink font-black uppercase tracking-widest animate-pulse">{secondaryError}</p>
                    )}
                    
                    <p className="text-[9px] text-neo-text-dim leading-relaxed uppercase tracking-[0.15em] opacity-40">
                        This allows you to be found via a second frequency while maintaining this primary account.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: PRIVACY */}
        {view === 'privacy' && (
          <motion.div 
            key="privacy" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            className="flex-1 h-full flex flex-col overflow-hidden"
          >
            {renderHeader('Privacy')}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-behavior-y-contain">
                <div className="p-6 border-b border-neo-border">
                    <h3 className="text-xs font-black uppercase text-neo-text-dim tracking-[0.2em] mb-5">Privacy Controls</h3>

                    {/* Last Seen */}
                    <div className="flex items-center justify-between py-3 border-b border-neo-border/50">
                        <div>
                          <span className="text-neo-text font-medium">Last Seen</span>
                          <p className="text-[11px] text-neo-text-dim mt-0.5">
                            {user?.lastSeenPrivacy === 'nobody' ? 'Hidden from everyone' : user?.lastSeenPrivacy === 'contacts' ? 'Contacts only' : 'Visible to everyone'}
                          </p>
                        </div>
                        <div className="flex rounded-xl overflow-hidden border border-neo-border">
                          {['everyone','contacts','nobody'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => updateSettings({ lastSeenPrivacy: opt })}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                (user?.lastSeenPrivacy || 'everyone') === opt
                                  ? 'bg-neo-primary text-black'
                                  : 'text-neo-text-dim hover:text-neo-text'
                              }`}
                            >
                              {opt === 'everyone' ? 'All' : opt === 'contacts' ? 'Contacts' : 'Nobody'}
                            </button>
                          ))}
                        </div>
                    </div>

                    {/* Disappearing Messages */}
                    <div className="flex items-center justify-between py-3 mt-1">
                        <div>
                          <span className="text-neo-text font-medium">Disappearing Messages</span>
                          <p className="text-[11px] text-neo-text-dim mt-0.5">
                            {user?.disappearingMessages === '1d' ? 'After 24 hours' : user?.disappearingMessages === '7d' ? 'After 7 days' : user?.disappearingMessages === '90d' ? 'After 90 days' : 'Messages stay forever'}
                          </p>
                        </div>
                        <div className="flex rounded-xl overflow-hidden border border-neo-border">
                          {['off','1d','7d','90d'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => updateSettings({ disappearingMessages: opt })}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                (user?.disappearingMessages || 'off') === opt
                                  ? 'bg-neo-primary text-black'
                                  : 'text-neo-text-dim hover:text-neo-text'
                               }`}
                            >
                              {opt === 'off' ? 'Off' : opt === '1d' ? '24h' : opt === '7d' ? '7d' : '90d'}
                            </button>
                          ))}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <UserX size={18} className="text-neo-pink" />
                        <h3 className="text-xs font-black uppercase text-neo-text tracking-[0.2em]">Blocked Contacts ({user?.blockedUsers?.length || 0})</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {blockedUserDetails.length > 0 ? (
                            blockedUserDetails.map(blocked => (
                                <div key={blocked.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <img src={blocked.avatar} className="w-10 h-10 rounded-full border border-neo-border" alt="" />
                                        <div>
                                            <p className="text-neo-text text-sm font-bold">{blocked.username}</p>
                                            <p className="text-neo-text-dim text-[10px] font-mono">{blocked.phone}</p>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => handleUnblock(blocked.id)}
                                      className="text-[10px] font-black uppercase tracking-widest text-neo-pink opacity-60 hover:opacity-100 transition-opacity"
                                    >Unblock</button>
                                </div>
                            ))
                        ) : (
                            <p className="text-neo-text-dim text-center py-8 text-xs italic tracking-widest">No active blocks in your frequency spectrum.</p>
                        )}
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: CHATS (CLEAN REDESIGN) */}
        {view === 'chats' && (
          <motion.div 
            key="chats" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            className="flex-1 h-full flex flex-col overflow-hidden"
          >
            {renderHeader('Chat Settings')}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-neo-bg overscroll-behavior-y-contain">
                
                {/* 1. Preview Area (Mock chat bubble) */}
                <div className="p-8 flex flex-col gap-4 border-b border-neo-border bg-neo-surface/20">
                    <div className="flex justify-start">
                        <div className="px-4 py-2.5 rounded-2xl bg-neo-surface border border-neo-border max-w-[80%]" style={{ borderRadius: `${user?.messageCorners ?? 16}px` }}>
                            <p className="text-sm text-neo-text-dim font-bold mb-1">LEGEND</p>
                            <p className="text-[15px] text-neo-text">Do you know what time it is?</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="px-4 py-2.5 rounded-2xl bg-neo-primary text-black max-w-[80%] shadow-lg shadow-neo-primary/20" style={{ borderRadius: `${user?.messageCorners ?? 16}px` }}>
                            <p className="text-[15px]">It's morning in Tokyo 😎</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* 2. Wallpaper & Name Color */}
                    <div className="space-y-4">
                        <button className="w-full flex items-center gap-4 py-2 group">
                            <ImageIcon size={20} className="text-neo-text-dim group-hover:text-neo-primary transition-colors" />
                            <span className="text-[16px] text-neo-text font-medium">Change Chat Wallpaper</span>
                        </button>
                        <button className="w-full flex items-center gap-4 py-2 group">
                            <PaletteIcon size={20} className="text-neo-text-dim group-hover:text-neo-primary transition-colors" />
                            <span className="text-[16px] text-neo-text font-medium flex-1 text-left">Change Name Color</span>
                            <div className="w-6 h-6 rounded-full bg-neo-secondary flex items-center justify-center text-[10px] font-black text-black">L</div>
                        </button>
                    </div>

                    <div className="h-px bg-neo-border" />

                    {/* 3. Color Theme Scroller */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-neo-primary tracking-[0.2em]">Color Theme</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x touch-pan-x">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => updateSettings({ defaultTheme: theme.id })}
                                    className={`relative flex-shrink-0 w-24 aspect-[2/3] rounded-2xl overflow-hidden border-2 transition-all snap-start ${
                                        (user?.defaultTheme || 'default') === theme.id ? 'border-neo-primary scale-105' : 'border-neo-border'
                                    }`}
                                >
                                    <div className="absolute inset-0" style={{ background: theme.preview }} />
                                    {/* Mock bubble in scroller */}
                                     <div className="absolute top-4 left-2 right-2 flex flex-col gap-1.5 pointer-events-none">
                                        <div className="h-2 w-8 bg-neo-text-dim/20 rounded-full" />
                                        <div className="h-2 w-12 bg-neo-primary/40 rounded-full self-end" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                                    {(user?.defaultTheme || 'default') === theme.id && (
                                        <div className="absolute inset-x-0 bottom-2 flex justify-center">
                                            <Check size={14} className="text-neo-primary" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Switch Mode & Browse */}
                    <div className="space-y-4">
                        <button 
                            onClick={async () => {
                                const newThemeId = user?.defaultTheme === 'wa-light' ? 'wa-dark' : 'wa-light';
                                await updateSettings({ defaultTheme: newThemeId });
                            }}
                            className="w-full flex items-center gap-4 py-2 group"
                        >
                            {user?.defaultTheme === 'wa-light' ? <Moon size={20} className="text-neo-text-dim" /> : <Sun size={20} className="text-neo-text-dim" />}
                            <span className="text-[16px] text-neo-text font-medium">Switch to {user?.defaultTheme === 'wa-light' ? 'Night' : 'Day'} Mode</span>
                        </button>
                        <button className="w-full flex items-center gap-4 py-2 group">
                            <CornerDownRight size={20} className="text-neo-text-dim" />
                            <span className="text-[16px] text-neo-text font-medium">Browse Themes</span>
                        </button>
                    </div>

                    <div className="h-px bg-neo-border" />

                    {/* 5. Message Corners Slider */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-neo-primary tracking-[0.2em]">Message corners</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <input 
                                type="range" 
                                min="0" 
                                max="30" 
                                value={user?.messageCorners ?? 16} 
                                onChange={(e) => updateSettings({ messageCorners: parseInt(e.target.value) })}
                                className="flex-1 accent-neo-primary bg-neo-border rounded-full h-1.5 appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-bold text-neo-primary min-w-[20px]">{user?.messageCorners ?? 16}</span>
                        </div>
                    </div>

                    {/* 6. Chat list view */}
                    <div className="space-y-6 pb-10">
                        <h3 className="text-xs font-black uppercase text-neo-primary tracking-[0.2em]">Chat list view</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-neo-surface border border-neo-border flex items-center justify-between opacity-50">
                                <div className="space-y-2">
                                    <div className="w-8 h-2 bg-neo-text-dim rounded-full" />
                                    <div className="w-12 h-2 bg-neo-text-dim/20 rounded-full" />
                                </div>
                                <div className="w-4 h-4 rounded-full border border-neo-primary" />
                            </div>
                            <div className="p-4 rounded-2xl bg-neo-surface border-2 border-neo-primary flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="w-12 h-2 bg-neo-text-dim rounded-full" />
                                    <div className="w-8 h-2 bg-neo-text-dim/20 rounded-full" />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-neo-primary flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-neo-bg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: FEATURES (DETAILED UPGRADE) */}
        {view === 'features' && (
          <motion.div 
            key="features" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            className="flex-1 h-full flex flex-col"
          >
            {renderHeader('Features')}
            <div className="flex-1 min-h-0 overflow-y-auto p-8 custom-scrollbar pb-24 overscroll-behavior-y-contain">
                <div className="space-y-10">
                    
                    {/* Identity Hub Section */}
                    <div className="p-8 rounded-[36px] bg-neo-surface/40 border-2 border-neo-border shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={80} className="text-neo-primary" />
                        </div>
                        <div className="relative z-10">
                           <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-neo-primary/10 rounded-2xl border border-neo-primary/30">
                                  <CheckCircle2 size={24} className="text-neo-primary" />
                              </div>
                              <div>
                                 <h3 className="text-[10px] text-neo-text-dim font-black tracking-[0.3em] uppercase">Cosmify Identity</h3>
                                 <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-neo-text italic tracking-tighter">{user?.phone}</span>
                                    {user?.isPremium && <CheckCircle2 size={20} className="text-neo-primary" />}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between p-4 md:p-5 bg-[#1a1b1e] rounded-2xl border border-white/10 shadow-xl overflow-hidden relative group/idcard">
                              <div className="absolute inset-0 bg-neo-primary/5 opacity-0 group-hover/idcard:opacity-100 transition-opacity" />
                              <div className="flex flex-col relative z-10">
                                 <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Protocol Type</span>
                                 <span className={`text-[13px] font-black uppercase italic tracking-wider ${user?.isPremium ? 'text-neo-primary' : 'text-white'}`}>
                                    {user?.isPremium ? 'BLUE NAME IDENTITY' : 'STANDARD FREQUENCY'}
                                 </span>
                              </div>
                              {!user?.isPremium && (
                                 <button 
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="relative z-10 px-5 py-2.5 bg-neo-primary text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neo-primary/20"
                                 >
                                    Get Blue Name
                                 </button>
                              )}
                           </div>
                           {!user?.isPremium && (
                             <div className="mt-4 p-3 bg-neo-pink/10 border border-neo-pink/20 rounded-xl">
                               <p className="text-[8px] text-neo-pink font-black uppercase tracking-widest leading-relaxed">
                                 ₹200 One-time. WARNING: Illegal or forging compulsory ban.
                               </p>
                             </div>
                           )}
                        </div>
                    </div>

                    {/* Stats & Tools Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Live Sync Module */}
                        <div className="p-8 rounded-[36px] border border-white/5 bg-neo-surface/20 flex flex-col gap-6 group hover:border-neo-primary/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-neo-primary/10 flex items-center justify-center">
                                        <Activity size={20} className="text-neo-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black tracking-widest uppercase text-neo-text-dim">Global Sync</h4>
                                        <p className="text-sm font-black text-neo-text italic tracking-tight">ACTIVE STATUS</p>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-neo-primary/20 rounded-lg">
                                    <span className="text-[9px] font-black text-neo-primary tracking-widest animate-pulse">0.1ms</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ width: ['40%', '95%', '85%', '98%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-neo-primary/40 to-neo-primary" 
                                />
                            </div>
                        </div>

                        {/* Neural Encryption Module */}
                        <div className="p-8 rounded-[36px] border border-white/5 bg-neo-surface/20 flex flex-col gap-4 group hover:border-neo-secondary/30 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-neo-secondary/10 flex items-center justify-center">
                                    <ShieldCheck size={20} className="text-neo-secondary" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-neo-text-dim">Neural Protocol</h4>
                                    <p className="text-sm font-black text-neo-text italic tracking-tight">QUANTUM PROOF E2EE</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-neo-text-dim font-bold leading-relaxed uppercase tracking-widest text-left">
                                YOUR COMMUNICATIONS ARE FRAGMENTED AND ENCRYPTED ACROSS THE NEURAL SPECTRUM.
                            </p>
                        </div>

                         {/* Neo Themes Module */}
                         <div className="p-8 rounded-[36px] border border-white/5 bg-neo-surface/20 flex items-center justify-between group hover:border-neo-purple/30 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-neo-purple/10 flex items-center justify-center">
                                    <Palette size={20} className="text-neo-purple" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-neo-text-dim">Appearance</h4>
                                    <p className="text-sm font-black text-neo-text italic tracking-tight uppercase">{user?.defaultTheme || 'DEFAULT'} INTERFACE</p>
                                </div>
                            </div>
                            <button onClick={() => setView('chats')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronRight size={20} className="text-white/20" />
                            </button>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="pt-4">
                        <button 
                            onClick={() => setView('main')}
                            className="w-full py-4 bg-neo-surface border border-neo-border text-neo-text text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white/5 transition-all"
                        >
                            Back To Settings
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <UPIPaymentModal 
         isOpen={isPaymentModalOpen}
         onClose={() => setIsPaymentModalOpen(false)}
         onSuccess={handlePaymentSuccess}
         amount={200}
         displayName={user?.username}
      />

    </motion.div>
  );
};

export default SettingsDrawer;
