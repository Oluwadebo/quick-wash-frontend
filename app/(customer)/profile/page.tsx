'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Bell, Settings, Verified, Droplets, Group, Sun, Handshake, Leaf, Lock, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const badges = [
  { id: 'early-bird', name: 'Early Bird', icon: Sun, color: 'bg-surface-container-high text-primary', rotate: 'rotate-3' },
  { id: 'perfect', name: 'Perfect Handover', icon: Handshake, color: 'bg-primary-container text-on-primary-container', rotate: '-rotate-6' },
  { id: 'eco', name: 'Eco-Warrior', icon: Leaf, color: 'bg-tertiary-container text-on-tertiary-container', rotate: 'rotate-12' },
  { id: 'legend', name: 'Laundry Legend', icon: Lock, color: 'bg-surface-container opacity-40', locked: true }
];

const history = [
  { id: 1, name: 'Full Wash & Fold', date: 'Oct 24 • Delivered', price: '$14.50' },
  { id: 2, name: 'Express Dry', date: 'Oct 18 • Delivered', price: '$6.20' }
];

export default function ProfilePage() {
  return (
    <div className="pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <Droplets className="text-primary w-6 h-6 fill-current" />
          <h1 className="text-on-surface font-extrabold tracking-tight font-headline text-lg">Quick-Wash</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
            <Bell className="text-on-surface w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
            <Settings className="text-on-surface w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        <section className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container shadow-sm relative">
              <Image 
                src="https://picsum.photos/seed/alex/200/200" 
                alt="User Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-1.5 rounded-full shadow-lg">
              <Verified className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">Alex Thompson</h2>
            <p className="font-label text-sm text-on-surface-variant">Sophomore • North Campus Dorms</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Top 5% User</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-sm relative overflow-hidden">
            <Shield className="absolute top-4 right-4 text-primary/10 w-10 h-10" />
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle className="text-surface-container-low" cx="80" cy="80" fill="none" r="70" stroke="currentColor" strokeWidth="12" />
                <circle className="text-primary" cx="80" cy="80" fill="none" r="70" stroke="currentColor" strokeWidth="12" strokeDasharray="440" strokeDashoffset="80" strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <span className="block text-5xl font-headline font-extrabold text-primary">82</span>
                <span className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Trust Points</span>
              </div>
            </div>
            <p className="text-center text-sm font-medium text-on-surface-variant px-4">You&apos;re &quot;Elite&quot; status! Your orders get priority pickup.</p>
          </section>

          <div className="grid grid-rows-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-[2rem] flex items-center justify-between">
              <div>
                <p className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Total Washes</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">47</h3>
              </div>
              <div className="bg-primary-container p-3 rounded-2xl">
                <Droplets className="text-on-primary-container w-6 h-6 fill-current" />
              </div>
            </div>
            <div className="bg-secondary p-6 rounded-[2rem] text-on-secondary flex flex-col justify-between overflow-hidden relative group">
              <div className="z-10">
                <p className="font-label text-[10px] uppercase font-bold tracking-widest opacity-80">Invite Friends</p>
                <h3 className="text-xl font-headline font-bold leading-tight mt-1">Get $10 Credit</h3>
              </div>
              <button className="z-10 mt-2 bg-on-secondary text-secondary font-label font-bold text-xs py-2 px-4 rounded-xl w-max active:scale-95 transition-transform">
                Share Code
              </button>
              <Group className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-headline font-bold">Earned Badges</h3>
            <span className="text-xs font-label font-bold text-primary cursor-pointer">View All</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {badges.map(badge => (
              <div key={badge.id} className={cn("flex-shrink-0 w-24 flex flex-col items-center space-y-2", badge.locked && "opacity-40")}>
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:rotate-0", badge.color, badge.rotate)}>
                  <badge.icon className="w-8 h-8 fill-current" />
                </div>
                <span className="text-[10px] font-label font-bold text-center leading-tight">{badge.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-headline font-bold">Recent History</h3>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <CheckCircle className="text-primary w-6 h-6 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-headline font-bold text-sm">{item.name}</h4>
                    <span className="font-label text-[10px] font-bold text-on-surface-variant">{item.price}</span>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
