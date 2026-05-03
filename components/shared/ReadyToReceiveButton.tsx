'use client';

import React from 'react';
import { DoorOpen, Volume2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/use-auth';

export default function ReadyToReceiveButton({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full h-24 rounded-3xl flex items-center justify-center gap-4 text-white font-headline font-black text-2xl tracking-tight shadow-2xl transition-all overflow-hidden",
        "kinetic-gradient shadow-primary/30"
      )}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      <DoorOpen className="w-8 h-8" />
      <span>I AM READY</span>
    </motion.button>
  );
}
