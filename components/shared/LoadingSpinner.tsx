'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Droplets } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-0 border-4 border-primary/20 rounded-[2rem]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 border-4 border-primary rounded-[2rem] border-t-transparent border-l-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets className="text-primary w-8 h-8 fill-current animate-bounce" />
        </div>
      </div>
      <p className="font-headline font-black text-xs uppercase tracking-[0.3em] text-primary animate-pulse">
        Quick-Wash Loading...
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface/80 backdrop-blur-xl flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
