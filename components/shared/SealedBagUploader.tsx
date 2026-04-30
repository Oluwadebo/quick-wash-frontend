'use client';

import React from 'react';
import { Camera, Upload, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/ApiService';

export default function SealedBagUploader({ orderId, onUploaded }: { orderId: string, onUploaded?: () => void }) {
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'success'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && orderId) {
      const file = e.target.files[0];
      setStatus('uploading');

      // Convert to Base64 to store in localStorage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const allOrders = await api.getOrders();
          const order = allOrders.find(o => o.id === orderId);
          if (order) {
            await api.saveOrder({
              ...order,
              evidenceImage: base64String
            });
            setStatus('success');
            if (onUploaded) onUploaded();
            window.dispatchEvent(new Event('storage'));
          }
        } catch (error) {
          console.error('Failed to save evidence image:', error);
          setStatus('idle');
          alert('Failed to upload image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment"
        onChange={handleUpload}
      />
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary-container p-3 rounded-2xl">
          <ShieldCheck className="text-primary w-6 h-6 fill-current" />
        </div>
        <div>
          <h3 className="font-headline font-black text-xl">Sealed Bag Verification</h3>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Security Step • Igbéṣẹ̀ Ààbò</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="aspect-video bg-surface-container-highest rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-6 group cursor-pointer hover:bg-white transition-colors" onClick={triggerUpload}>
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="text-primary w-8 h-8" />
              </div>
              <p className="font-headline font-bold text-on-surface">Snap the Sealed Bag</p>
              <p className="text-xs text-on-surface-variant mt-1">Ensure the security tag is visible</p>
            </div>
            
            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-2xl border border-primary/5">
              <Info className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This photo protects both you and the vendor. It confirms the bag was sealed correctly at pickup.
              </p>
            </div>
          </motion.div>
        )}

        {status === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-video flex flex-col items-center justify-center text-center"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
              />
            </div>
            <p className="font-headline font-black text-lg mt-6 animate-pulse">Uploading Proof...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-video bg-primary/5 rounded-3xl flex flex-col items-center justify-center text-center p-6 border-2 border-primary"
          >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
            <h4 className="font-headline font-black text-2xl text-primary">Verification Uploaded!</h4>
            <p className="text-sm font-bold text-on-surface-variant mt-2">Handover code is now active.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
