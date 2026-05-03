'use client';

import React from 'react';
import { Bolt, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ReadyForPickupButtonProps {
  onClick?: () => void;
  label?: string;
  audioText?: string;
}

import { useAuth } from '@/hooks/use-auth';

export default function ReadyForPickupButton({ 
  onClick, 
  label = "I'M READY FOR PICKUP"
}: ReadyForPickupButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full h-24 rounded-3xl flex items-center justify-center gap-4 text-white font-headline font-black text-2xl tracking-tight shadow-2xl transition-all overflow-hidden",
        "signature-gradient shadow-primary/30"
      )}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      <Bolt className="w-8 h-8 fill-current" />
      <span>{label}</span>
    </motion.button>
  );
}
