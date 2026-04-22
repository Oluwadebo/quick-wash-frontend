'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={cn(
        "fixed bottom-24 left-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[300] flex items-center gap-3 font-headline font-black text-sm min-w-[300px]",
        type === 'success' ? "bg-success text-on-success" : 
        type === 'error' ? "bg-error text-on-error" : 
        type === 'warning' ? "bg-warning text-on-warning" : "bg-primary text-on-primary"
      )}
    >
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {(type === 'error' || type === 'warning') && <AlertTriangle className="w-5 h-5" />}
      {type === 'info' && <Info className="w-5 h-5" />}
      
      <span className="flex-1">{message}</span>
      
      <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
