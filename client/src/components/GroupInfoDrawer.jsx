import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RotateCcw, Pencil, Check, Shield, ShieldOff,
  UserMinus, UserPlus, X, Search, Crown, Info, CheckCircle2, UserX
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import {
  doc, updateDoc, getDoc, collection, query,
  where, getDocs, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const GroupInfoDrawer = ({ isOpen, onClose }) => {
  const { selectedChat, user, setSelectedChat } = useChat();
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupSeed, setGroupSeed] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  // Add member
  const [addPhone, setAddPhone] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [addSearching, setAddSearching] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef();

  const isAdmin = selectedChat?.admins?.includes(user?._id) || selectedChat?.createdBy === user?._id;
  const groupAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${groupSeed || selectedChat?.groupSeed || 'group'}`;

  // Sync state when drawer opens
  useEffect(() => {
    if (!selectedChat || !isOpen) return;
    setGroupName(selectedChat.groupName || '');
    setGroupDesc(selectedChat.groupDescription || '');
    setGroupSeed(selectedChat.groupSeed || selectedChat.groupAvatar?.split('seed=')[1] || 'group');
    fetchMembers();
  }, [selectedChat?._id, isOpen]);

  const fetchMembers = async () => {
    if (!selectedChat?.participantIds?.length) return;
    try {
      const results = await Promise.all(
        selectedChat.participantIds.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? { _id: uid, ...snap.data() } : null;
        })
      );
      setMembers(results.filter(Boolean));
    } catch (e) { console.error(e); }
  };

  const saveField = async (field, value) => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      const ref = doc(db, 'conversations', selectedChat._id);
      await updateDoc(ref, { [field]: value.trim() });
      setSelectedChat(prev => ({ ...prev, [field]: value.trim() }));
      if (field === 'groupName') setEditingName(false);
      if (field === 'groupDescription') setEditingDesc(false);
    } catch (e) { console.error(e); setError('Update failed.'); }
    setLoading(false);
  };

  const changeAvatar = async () => {
    const newSeed = 'group' + Math.random().toString(36).substring(2);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;
    setGroupSeed(newSeed);
    try {
      const ref = doc(db, 'conversations', selectedChat._id);
      await updateDoc(ref, { groupAvatar: newAvatar, groupSeed: newSeed });
      setSelectedChat(prev => ({ ...prev, groupAvatar: newAvatar, groupSeed: newSeed }));
    } catch (e) { console.error(e); }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat?._id) return;
    if (!file.type.startsWith('image/')) return setError('Please select an image file');
    
    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      const storageRef = ref(storage, `group-icons/${selectedChat._id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Group icon upload error:", error);
          setIsUploading(false);
          setError("Failed to upload icon.");
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const ref = doc(db, 'conversations', selectedChat._id);
          await updateDoc(ref, { groupAvatar: downloadURL, groupSeed: null });
          setSelectedChat(prev => ({ ...prev, groupAvatar: downloadURL, groupSeed: null }));
          setIsUploading(false);
        }
      );
    } catch (err) {
      console.error("Icon process error:", err);
      setIsUploading(false);
    }
  };

  const promoteAdmin = async (uid) => {
    const ref = doc(db, 'conversations', selectedChat._id);
    await updateDoc(ref, { admins: arrayUnion(uid) });
    setSelectedChat(prev => ({ ...prev, admins: [...(prev.admins || []), uid] }));
  };

  const demoteAdmin = async (uid) => {
    const ref = doc(db, 'conversations', selectedChat._id);
    await updateDoc(ref, { admins: arrayRemove(uid) });
    setSelectedChat(prev => ({ ...prev, admins: (prev.admins || []).filter(id => id !== uid) }));
  };

  const removeMember = async (uid) => {
    if (!isAdmin) return;
    if (uid === selectedChat?.createdBy) { setError("Can't remove group creator."); return; }
    if (!window.confirm('Remove this member from the group?')) return;
    const ref = doc(db, 'conversations', selectedChat._id);
    await updateDoc(ref, {
      participantIds: arrayRemove(uid)
    });
    setSelectedChat(prev => ({ ...prev, participantIds: prev.participantIds.filter(id => id !== uid) }));
    setMembers(prev => prev.filter(m => m._id !== uid));
  };

  const searchToAdd = async (val) => {
    const clean = val.replace(/\D/g, '');
    setAddPhone(clean);
    if (clean.length !== 10) { setAddResults([]); return; }
    setAddSearching(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('phone', '==', clean)));
      const results = snap.docs
        .map(d => ({ ...d.data(), _id: d.id }))
        .filter(u => !selectedChat?.participantIds?.includes(u._id));
      setAddResults(results);
    } catch (e) { console.error(e); }
    setAddSearching(false);
  };

  const addMember = async (newUser) => {
    const ref = doc(db, 'conversations', selectedChat._id);
    await updateDoc(ref, { participantIds: arrayUnion(newUser._id) });
    setSelectedChat(prev => ({ ...prev, participantIds: [...prev.participantIds, newUser._id] }));
    setMembers(prev => [...prev, newUser]);
    setAddPhone(''); setAddResults([]); setShowAddPanel(false);
  };

  const memberRole = (uid) => {
    if (uid === selectedChat?.createdBy) return 'creator';
    if (selectedChat?.admins?.includes(uid)) return 'admin';
    return 'member';
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-neo-bg flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="h-[108px] bg-neo-surface flex items-end p-6 pb-6 border-b border-neo-border flex-shrink-0">
        <div className="flex items-center gap-4 w-full">
          <button onClick={onClose} className="hover:bg-white/5 p-2 rounded-full transition-colors text-white">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-black uppercase italic tracking-tighter text-white flex-1">Group Info</h2>
          {!isAdmin && <span className="text-[10px] text-neo-text-dim font-bold uppercase tracking-widest bg-neo-surface px-3 py-1 rounded-full border border-neo-border">Member</span>}
          {isAdmin && <span className="text-[10px] text-neo-primary font-bold uppercase tracking-widest bg-neo-primary/10 px-3 py-1 rounded-full border border-neo-primary/30 flex items-center gap-1"><Crown size={10} /> Admin</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Avatar */}
        <div className="flex flex-col items-center pt-8 pb-6 border-b border-neo-border px-6">
          <div className="relative group mb-5">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleIconUpload} 
            />
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neo-primary shadow-[0_0_30px_rgba(106,13,173,0.3)] bg-neo-surface relative">
              <img src={groupAvatar} alt="Group" className={`w-full h-full object-cover ${isUploading ? 'opacity-30' : ''}`} />
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin mb-1" />
                    <span className="text-[10px] font-black text-neo-primary uppercase tracking-widest">{uploadProgress}%</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <>
                <div 
                  onClick={() => !isUploading && fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  <Pencil size={24} className="text-neo-primary mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload Foto</span>
                </div>
                <button 
                  onClick={changeAvatar}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 p-2 bg-neo-primary rounded-full text-white shadow-lg hover:scale-110 transition-all z-20 disabled:opacity-50"
                  title="Randomize Avatar"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            )}
          </div>

          {/* Group Name */}
          <div className="w-full max-w-sm space-y-1 mb-4">
            <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em]">Group Name</label>
            <div className="flex items-center gap-2 border-b border-neo-border pb-2">
              {editingName && isAdmin
                ? <input value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus
                    className="flex-1 bg-transparent text-neo-text text-[18px] font-bold outline-none" />
                : <span className="flex-1 text-[18px] font-bold text-neo-text">{selectedChat?.groupName}</span>
              }
              {isAdmin && (
                <button onClick={() => editingName ? saveField('groupName', groupName) : setEditingName(true)}
                  className="text-neo-primary p-1">
                  {editingName ? <Check size={20} /> : <Pencil size={16} className="opacity-50 hover:opacity-100" />}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="w-full max-w-sm space-y-1">
            <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em]">Description</label>
            <div className="flex items-start gap-2 border-b border-neo-border pb-2">
              {editingDesc && isAdmin
                ? <textarea value={groupDesc} onChange={e => setGroupDesc(e.target.value)} autoFocus rows={2}
                    className="flex-1 bg-transparent text-neo-text text-[14px] font-light outline-none resize-none" />
                : <span className="flex-1 text-[14px] font-light text-neo-text-dim min-h-[1.5rem]">
                    {selectedChat?.groupDescription || (isAdmin ? 'Add a description...' : 'No description')}
                  </span>
              }
              {isAdmin && (
                <button onClick={() => editingDesc ? saveField('groupDescription', groupDesc) : setEditingDesc(true)}
                  className="text-neo-primary p-1 mt-0.5">
                  {editingDesc ? <Check size={20} /> : <Pencil size={16} className="opacity-50 hover:opacity-100" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase text-neo-primary tracking-[0.2em]">
              Members · {members.length}
            </h3>
            {isAdmin && (
              <button onClick={() => setShowAddPanel(!showAddPanel)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neo-primary hover:opacity-80 transition-opacity">
                <UserPlus size={14} /> Add
              </button>
            )}
          </div>

          {/* Add member panel */}
          <AnimatePresence>
            {showAddPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden">
                <div className="flex items-center gap-3 px-4 h-[42px] bg-neo-surface border border-neo-border rounded-full focus-within:border-neo-primary transition-all mb-2">
                  <Search size={14} className="text-neo-text-dim flex-shrink-0" />
                  <input type="text" value={addPhone} maxLength={10} onChange={e => searchToAdd(e.target.value)}
                    placeholder="Search by phone to add..." autoFocus
                    className="flex-1 bg-transparent outline-none text-[13px] text-neo-text placeholder:text-neo-text-dim" />
                  {addSearching && <div className="w-4 h-4 border-2 border-neo-primary border-t-transparent rounded-full animate-spin" />}
                </div>
                {addResults.map(u => (
                  <button key={u._id} onClick={() => addMember(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neo-surface transition-colors text-left">
                    <img src={u.avatar} alt="" className="w-9 h-9 rounded-full border border-neo-border" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neo-text">{u.username}</p>
                      <p className="text-[10px] text-neo-text-dim font-mono">{u.phone}</p>
                    </div>
                    <span className="text-[10px] font-black text-neo-primary uppercase tracking-widest">Add</span>
                  </button>
                ))}
                {addPhone.length === 10 && !addSearching && addResults.length === 0 && (
                  <p className="text-center text-xs text-neo-text-dim py-2 italic">No user found or already a member</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Member list */}
          <div className="space-y-2">
            {members.map(m => {
              const role = memberRole(m._id);
              const isSelf = m._id === user._id;
              return (
                <div key={m._id} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-neo-surface transition-colors group">
                  <div className="relative">
                    <img src={m.avatar} alt="" className="w-11 h-11 rounded-full border-2 border-neo-border" />
                    {role !== 'member' && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${role === 'creator' ? 'bg-neo-secondary' : 'bg-neo-primary'}`}>
                        <Crown size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neo-text truncate flex items-center gap-1.5">
                      {m.username}{isSelf && <span className="text-neo-primary"> (You)</span>}
                      {m.isBanned ? (
                        <span className="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                          <UserX size={10} className="text-red-500" />
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Banned</span>
                        </span>
                      ) : m.isPremium && (
                        <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10 shrink-0" />
                      )}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      role === 'creator' ? 'text-neo-secondary' : role === 'admin' ? 'text-neo-primary' : 'text-neo-text-dim/50'
                    }`}>
                      {role}
                    </p>
                  </div>
                  {/* Admin actions */}
                  {isAdmin && !isSelf && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {role === 'member' && (
                        <button onClick={() => promoteAdmin(m._id)} title="Make Admin"
                          className="p-1.5 rounded-lg text-neo-primary hover:bg-neo-primary/10 transition-colors">
                          <Shield size={14} />
                        </button>
                      )}
                      {role === 'admin' && selectedChat?.createdBy !== m._id && (
                        <button onClick={() => demoteAdmin(m._id)} title="Remove Admin"
                          className="p-1.5 rounded-lg text-neo-text-dim hover:bg-neo-surface transition-colors">
                          <ShieldOff size={14} />
                        </button>
                      )}
                      {selectedChat?.createdBy !== m._id && (
                        <button onClick={() => removeMember(m._id)} title="Remove from group"
                          className="p-1.5 rounded-lg text-neo-pink hover:bg-neo-pink/10 transition-colors">
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-neo-pink text-xs font-bold uppercase tracking-widest text-center px-6 pb-4">{error}</p>
        )}
      </div>
    </motion.div>
  );
};

export default GroupInfoDrawer;
