'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function YorubaAudioToggle() {
  const [isEnabled, setIsEnabled] = React.useState(false);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('yoruba-audio-enabled');
    setIsEnabled(stored === 'true');
  }, []);

  const toggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    sessionStorage.setItem('yoruba-audio-enabled', String(newState));
    
    // Play a small feedback sound if enabled
    if (newState) {
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('Ẹ káàbọ̀ sí Quick Wash');
        msg.lang = 'yo-NG'; // Yoruba Nigeria
        window.speechSynthesis.speak(msg);
      }
      console.log('Yoruba Audio Enabled: "Ẹ káàbọ̀!"');
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-3 px-5 py-2.5 rounded-full transition-all active:scale-95 border-2 shadow-sm",
        isEnabled 
          ? "bg-primary/10 border-primary text-primary" 
          : "bg-surface-container-highest border-transparent text-on-surface-variant"
      )}
    >
      {isEnabled ? (
        <Volume2 className="w-5 h-5 fill-current animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
      <span className="font-headline font-black text-xs uppercase tracking-widest">
        {isEnabled ? "Audio: Yoruba" : "Audio: English"}
      </span>
    </button>
  );
}
