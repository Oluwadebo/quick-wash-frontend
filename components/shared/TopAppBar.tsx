'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Volume2, X, User, Droplets } from 'lucide-react';
import Link from 'next/link';
import YorubaAudioToggle from './YorubaAudioToggle';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

interface TopAppBarProps {
  title?: string;
  showAudioToggle?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  roleLabel?: string;
}

export default function TopAppBar({ 
  title, 
  showAudioToggle = false, 
  showClose = false, 
  onClose,
  roleLabel
}: TopAppBarProps) {
  const { user } = useAuth();
  const homeLink = user?.role === 'customer' ? '/customer' : (user?.role ? `/${user.role}` : '/');

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-primary/5">
      <div className="flex justify-between items-center px-6 h-20 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link href={homeLink} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <Droplets className="text-white w-6 h-6 fill-current" />
            </div>
            {!title && (
              <span className="font-headline font-black text-xl tracking-tighter text-on-surface">Quick-Wash</span>
            )}
          </Link>
          
          {title && (
            <h1 className="text-on-surface font-black font-headline text-xl tracking-tight">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showAudioToggle && <YorubaAudioToggle />}
          
          {showClose ? (
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface active:scale-95 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {roleLabel && (
                <span className="hidden md:block font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                  {roleLabel}
                </span>
              )}
              <Link href={user?.role === 'customer' ? '/profile' : `/${user?.role}/profile` || '/profile'}>
                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-surface-container-highest relative border-2 border-primary-container shadow-md active:scale-95 transition-transform flex items-center justify-center">
                  <User className="w-8 h-8 text-on-surface-variant" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
