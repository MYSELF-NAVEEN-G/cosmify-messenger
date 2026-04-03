import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Upload, AlertTriangle, QrCode, Phone, CreditCard, ArrowRight } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const UPIPaymentModal = ({ isOpen, onClose, onSuccess, amount = 200, vpa = 'dhanunaveen2415@oksbi', displayName }) => {
  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent("Cosmify")}&am=${amount}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      setError(null);
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleConfirm = async () => {
    if (!utr || utr.length < 12) return setError("Please enter a valid 12-digit UTR/Transaction ID.");
    
    setLoading(true);
    try {
      // Direct success without file upload
      onSuccess({ utr, proofUrl: null });
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-[450px] neo-glass-dark rounded-[32px] p-8 border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neo-primary/20 rounded-xl">
                <CreditCard className="text-neo-primary" size={20} />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Claim Blue Identity</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} className="text-white/50" />
            </button>
          </div>

          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="flex flex-col items-center bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="relative p-3 bg-white rounded-2xl mb-4 shadow-lg group">
                <img src={qrUrl} alt="UPI QR" className="w-40 h-40" />
                <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                    <span className="bg-neo-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Scan to Pay ₹{amount}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2 w-full mt-2">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">UPI ID (VPA)</p>
                <div className="flex items-center justify-between w-full bg-black/40 rounded-xl px-4 py-3 border border-white/5 group hover:border-neo-primary/30 transition-colors">
                  <span className="text-sm font-medium text-white/80">{vpa}</span>
                  <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg transition-colors overflow-hidden relative">
                    {copied ? <Check size={16} className="text-neo-primary" /> : <Copy size={16} className="text-white/40 group-hover:text-neo-primary" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em] ml-1">Transaction ID (12-Digit UTR)</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 12-digit UTR number"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neo-primary text-white text-sm transition-all focus:ring-1 focus:ring-neo-primary/30"
                />
              </div>
            </div>

            {/* Security Warning */}
            <div className="bg-neo-pink/10 border border-neo-pink/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-neo-pink shrink-0" size={18} />
              <p className="text-[10px] text-neo-pink/90 font-black leading-relaxed uppercase italic">
                IMPORTANT: Fake or illegal payments will lead to a permanent account ban. WARNING: Illegal or forging compulsory ban. We verify every UTR manually.
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neo-pink text-[10px] font-black uppercase text-center bg-neo-pink/10 py-2 rounded-lg">
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleConfirm}
              disabled={loading || !utr}
              className="w-full py-5 bg-neo-primary text-white font-black uppercase tracking-[0.3em] text-xs italic rounded-2xl shadow-xl hover:shadow-neo-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
            >
                {loading ? "Confirming..." : (
                    <span className="flex items-center justify-center gap-2">
                        I Have Paid ₹{amount} <ArrowRight size={14} />
                    </span>
                )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UPIPaymentModal;
