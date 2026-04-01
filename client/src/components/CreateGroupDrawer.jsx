import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Check, Users, RotateCcw } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp
} from 'firebase/firestore';

const CreateGroupDrawer = ({ isOpen, onClose }) => {
  const { user, setSelectedChat } = useChat();
  const [step, setStep] = useState('select'); // 'select' | 'name'
  const [phoneInput, setPhoneInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupSeed, setGroupSeed] = useState('group' + Date.now());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const groupAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${groupSeed}`;

  const handleSearch = async (val) => {
    const clean = val.replace(/\D/g, '');
    setPhoneInput(clean);
    if (clean.length !== 10) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('phone', '==', clean)));
      const results = snap.docs
        .map(d => ({ ...d.data(), _id: d.id }))
        .filter(u => u._id !== user._id && !selectedMembers.find(m => m._id === u._id));
      setSearchResults(results);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const addMember = (u) => {
    setSelectedMembers(prev => [...prev, u]);
    setPhoneInput('');
    setSearchResults([]);
  };

  const removeMember = (id) => setSelectedMembers(prev => prev.filter(m => m._id !== id));

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Please enter a group name.'); return; }
    if (selectedMembers.length < 1) { setError('Add at least 1 member.'); return; }
    setCreating(true);
    setError('');
    try {
      const participantIds = [user._id, ...selectedMembers.map(m => m._id)];
      const docRef = await addDoc(collection(db, 'conversations'), {
        isGroup: true,
        groupName: groupName.trim(),
        groupAvatar,
        groupSeed,
        groupDescription: '',
        participantIds,
        createdBy: user._id,
        admins: [user._id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: { text: `${user.username} created this group`, senderId: 'system', createdAt: serverTimestamp() }
      });
      setSelectedChat({
        _id: docRef.id,
        isGroup: true,
        groupName: groupName.trim(),
        groupAvatar,
        groupSeed,
        groupDescription: '',
        participantIds,
        createdBy: user._id,
        admins: [user._id],
        members: [{ ...user, _id: user._id }, ...selectedMembers]
      });
      // Reset and close
      setStep('select'); setSelectedMembers([]); setGroupName(''); setPhoneInput('');
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to create group. Try again.');
    } finally { setCreating(false); }
  };

  const handleClose = () => {
    setStep('select'); setSelectedMembers([]); setGroupName('');
    setPhoneInput(''); setSearchResults([]); setError('');
    onClose();
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-neo-bg flex flex-col shadow-2xl overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {/* STEP 1: SELECT MEMBERS */}
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="h-[108px] bg-neo-surface flex items-end p-6 pb-6 border-b border-neo-border">
              <div className="flex items-center gap-6 w-full">
                <button onClick={handleClose} className="hover:bg-white/5 p-2 rounded-full transition-colors text-white">
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-[20px] font-black uppercase italic tracking-tighter text-white">New Group</h2>
                  <p className="text-xs text-neo-text-dim tracking-widest">{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</p>
                </div>
              </div>
            </div>

            {/* Selected chips */}
            {selectedMembers.length > 0 && (
              <div className="flex gap-2 px-4 py-3 flex-wrap border-b border-neo-border bg-neo-surface/40">
                {selectedMembers.map(m => (
                  <div key={m._id} className="flex items-center gap-1.5 bg-neo-primary/20 border border-neo-primary/30 rounded-full px-3 py-1">
                    <img src={m.avatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-bold text-neo-primary">{m.username}</span>
                    <button onClick={() => removeMember(m._id)} className="text-neo-primary/60 hover:text-neo-pink ml-1">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="px-4 py-4 border-b border-neo-border">
              <div className="flex items-center gap-3 px-4 h-[46px] bg-neo-surface border border-neo-border rounded-full focus-within:border-neo-primary transition-all">
                <Search size={16} className="text-neo-text-dim" />
                <input
                  type="text"
                  value={phoneInput}
                  maxLength={10}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by phone number..."
                  className="flex-1 bg-transparent outline-none text-[14px] text-neo-text placeholder:text-neo-text-dim"
                />
                {searching && <div className="w-4 h-4 border-2 border-neo-primary border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-2">
              {searchResults.map(u => (
                <button key={u._id} onClick={() => addMember(u)}
                  className="w-full flex items-center gap-4 px-4 py-3 bg-neo-surface border border-neo-border rounded-2xl hover:border-neo-primary/40 transition-all group text-left">
                  <img src={u.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-neo-border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neo-text">{u.username}</p>
                    <p className="text-xs text-neo-text-dim font-mono">{u.phone}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full border-2 border-neo-primary/40 group-hover:bg-neo-primary group-hover:border-neo-primary flex items-center justify-center transition-all">
                    <Check size={14} className="text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
              {phoneInput.length === 10 && !searching && searchResults.length === 0 && (
                <p className="text-center text-neo-text-dim text-xs py-8 uppercase tracking-widest">No user found</p>
              )}
            </div>

            {/* Next button */}
            {selectedMembers.length > 0 && (
              <div className="px-6 pb-8 pt-4 border-t border-neo-border">
                <button onClick={() => setStep('name')}
                  className="w-full py-4 bg-neo-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-3">
                  <Users size={18} /> Next — Name Group
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: NAME & CREATE */}
        {step === 'name' && (
          <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="h-[108px] bg-neo-surface flex items-end p-6 pb-6 border-b border-neo-border">
              <div className="flex items-center gap-6 w-full">
                <button onClick={() => setStep('select')} className="hover:bg-white/5 p-2 rounded-full transition-colors text-white">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-[20px] font-black uppercase italic tracking-tighter text-white">New Group</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
              {/* Group avatar */}
              <div className="relative group mb-8">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-neo-primary shadow-[0_0_30px_rgba(106,13,173,0.3)] bg-neo-surface">
                  <img src={groupAvatar} alt="Group" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => setGroupSeed('group' + Math.random())}
                  className="absolute bottom-2 right-2 p-3 bg-neo-primary rounded-full text-white shadow-lg hover:scale-110 transition-all">
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Group name input */}
              <div className="w-full mb-8">
                <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1 block mb-3">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Squad, Family, Work..."
                  className="w-full bg-neo-surface border border-neo-border rounded-2xl px-5 py-4 text-neo-text text-[16px] outline-none focus:border-neo-primary transition-all placeholder:text-neo-text-dim/40"
                  maxLength={50}
                  autoFocus
                />
              </div>

              {/* Members preview */}
              <div className="w-full mb-8">
                <label className="text-[10px] text-neo-text-dim font-black uppercase tracking-[0.2em] ml-1 block mb-3">Members ({selectedMembers.length + 1})</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-neo-surface border border-neo-border">
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-full" />
                    <span className="text-sm text-neo-text font-medium">{user.username} <span className="text-neo-primary text-xs">(You)</span></span>
                  </div>
                  {selectedMembers.map(m => (
                    <div key={m._id} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-neo-surface border border-neo-border">
                      <img src={m.avatar} alt="" className="w-9 h-9 rounded-full" />
                      <span className="text-sm text-neo-text font-medium">{m.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-neo-pink text-xs font-bold uppercase tracking-widest mb-4">{error}</p>}

              <button onClick={handleCreate} disabled={creating}
                className="w-full py-4 bg-neo-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                {creating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Users size={18} /> Create Group</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreateGroupDrawer;
