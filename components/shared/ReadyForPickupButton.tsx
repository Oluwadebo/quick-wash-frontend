'use client';

import React from 'react';
import { Bolt, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function ReadyForPickupButton() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleAction = () => {
    // Yoruba Audio Cue Logic
    const audioEnabled = localStorage.getItem('yoruba-audio-enabled') === 'true';
    if (audioEnabled) {
      setIsPlaying(true);
      // In a real app, you'd play an actual audio file here
      // const audio = new Audio('/audio/ready-for-pickup.mp3');
      // audio.play();
      console.log('Playing Yoruba Audio: "Mo ti ṣe tán fún kíkó lọ"');
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAction}
      className={cn(
        "relative w-full h-24 rounded-3xl flex items-center justify-center gap-4 text-white font-headline font-black text-2xl tracking-tight shadow-2xl transition-all overflow-hidden",
        isPlaying ? "bg-tertiary shadow-tertiary/30" : "signature-gradient shadow-primary/30"
      )}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      
      {isPlaying ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Volume2 className="w-8 h-8 animate-bounce" />
          <span>Ẹ KÚ IṢẸ́ O!</span>
        </motion.div>
      ) : (
        <>
          <Bolt className="w-8 h-8 fill-current" />
          <span>I&apos;M READY FOR PICKUP</span>
        </>
      )}

      {/* Visual Audio Waves when playing */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 flex items-end gap-1 px-4">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 12, 4] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
              className="flex-1 bg-white/40 rounded-t-full"
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
