'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { useAuth } from '@/hooks/use-auth';
import { User, Bike, Star, History, Wallet, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export default function RiderProfilePage() {
  const { user, logout } = useAuth();
  
  return (
    <div className="pb-32">
      <TopAppBar title="Rider Profile" roleLabel="Rider" />
      
      <main className="pt-28 px-6 max-w-2xl mx-auto">
        <div className="bg-surface-container-low rounded-[3rem] p-10 text-center mb-8 border border-primary/5 shadow-sm">
          <div className="w-32 h-32 rounded-[2.5rem] bg-surface-container-highest mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-xl">
            <Bike className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-3xl font-headline font-black text-on-surface">{user?.fullName || 'Rider Name'}</h2>
          <p className="text-primary font-black text-sm uppercase tracking-widest mt-2">{user?.vehicleType || 'Bicycle'} Rider</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Wallet Balance</p>
            <h4 className="text-2xl font-headline font-black text-primary">₦12,500</h4>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Trust Score</p>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-tertiary fill-current" />
              <h4 className="text-2xl font-headline font-black text-on-surface">4.8</h4>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: History, label: 'Delivery History', href: '#' },
            { icon: Wallet, label: 'Withdrawal', href: '#' },
            { icon: Settings, label: 'Account Settings', href: '#' },
          ].map((item, i) => (
            <button key={i} className="w-full bg-white p-6 rounded-2xl flex items-center justify-between border border-primary/5 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <item.icon className="w-6 h-6 text-on-surface-variant" />
                <span className="font-headline font-black text-on-surface">{item.label}</span>
              </div>
            </button>
          ))}
          
          <button 
            onClick={logout}
            className="w-full bg-error/5 p-6 rounded-2xl flex items-center justify-between border border-error/10 hover:bg-error/10 transition-colors mt-8"
          >
            <div className="flex items-center gap-4 text-error">
              <LogOut className="w-6 h-6" />
              <span className="font-headline font-black">Logout</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
