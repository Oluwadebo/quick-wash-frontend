'use client';

import React from 'react';
import { Menu, Volume2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TopAppBarProps {
  title?: string;
  showMenu?: boolean;
  showAudioToggle?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  userImage?: string;
  roleLabel?: string;
}

export default function TopAppBar({
  title = "Quick-Wash",
  showMenu = true,
  showAudioToggle = false,
  showClose = false,
  onClose,
  userImage = "https://picsum.photos/seed/user/100/100",
  roleLabel
}: TopAppBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 h-20">
      <div className="flex items-center gap-4">
        {showMenu && (
          <button className="hover:bg-surface-container-low p-2 rounded-full transition-colors active:scale-95 duration-200">
            <Menu className="text-primary w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col">
          <span className="text-on-surface font-headline font-black tracking-tight text-xl">
            {title}
          </span>
          {roleLabel && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showAudioToggle && (
          <div className="bg-primary-container/30 px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/10">
            <Volume2 className="text-primary w-4 h-4 fill-current" />
            <span className="font-label text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Yoruba Audio ON
            </span>
          </div>
        )}
        
        {showClose ? (
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <X className="text-on-surface-variant w-6 h-6" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container relative">
            <Image
              src={userImage}
              alt="Profile"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </header>
  );
}
