'use client';

import React, { useEffect, useState } from 'react';
import { Menu, volume2, X, User, Droplets, LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { api, SiteSettings } from '@/lib/ApiService';

interface TopAppBarProps {
  title?: string;
  showClose?: boolean;
  onClose?: () => void;
  roleLabel?: string;
}

export default function TopAppBar({ 
  title, 
  showClose = false, 
  onClose,
  roleLabel
}: TopAppBarProps) {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    api.getSiteSettings().then(setSettings);
    // Run auto-cancel every minute
    const interval = setInterval(() => {
      api.runAutoCancel();
    }, 60000);
    
    // Run once on mount
    api.runAutoCancel();
    
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'super-sub-admin';
  const homeLink = user?.role === 'customer' ? '/customer' : (isAdmin ? '/admin' : (user?.role ? `/${user.role}` : '/'));
  const profileLink = user?.role === 'customer' 
    ? '/profile' 
    : (user?.role === 'vendor' 
        ? '/vendor?tab=settings' 
        : (user?.role === 'rider' 
            ? '/rider?tab=settings' 
            : (isAdmin ? '/admin?tab=settings' : '/profile')));

  return (
    <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b-2 border-primary/10">
      <div className="flex justify-between items-center px-6 h-20 w-full">
        <div className="flex items-center gap-4">
          <Link href={homeLink} className="flex lg:hidden items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              {settings?.logo ? (
                <Image src={settings.logo} alt="Logo" width={24} height={24} className="object-contain" unoptimized />
              ) : (
                <Droplets className="text-white w-6 h-6 fill-current" />
              )}
            </div>
            <span className="font-headline font-black text-xl tracking-tighter text-on-surface hidden xs:block">
              {settings?.name || 'Quick-Wash'}
            </span>
          </Link>
          
          {title && (
            <div className="flex items-center gap-2 lg:ml-0">
              <span className="h-4 w-px bg-outline-variant/30 hidden xs:block lg:hidden"></span>
              <h1 className="text-on-surface font-black font-headline text-lg tracking-tight">{title}</h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
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
              {user && (
                <button 
                  onClick={logout}
                  className="flex lg:hidden items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error font-headline font-black text-xs uppercase tracking-widest hover:bg-error/20 transition-colors active:scale-95"
                >
                  <LogOut className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              )}
              {user && (
                <div className="flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Welcome</span>
                  <span className="text-sm font-headline font-black text-on-surface leading-none">{user.fullName || 'User'}</span>
                </div>
              )}
              <Link href={profileLink}>
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
