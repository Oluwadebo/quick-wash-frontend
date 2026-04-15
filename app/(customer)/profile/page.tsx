'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import Link from 'next/link';
import { Bell, Settings, Verified, Droplets, Group, Sun, Handshake, Leaf, Lock, CheckCircle, Shield, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const badges = [
  { id: 'early-bird', name: 'Early Bird', icon: Sun, color: 'bg-surface-container-high text-primary', rotate: 'rotate-3' },
  { id: 'perfect', name: 'Perfect Handover', icon: Handshake, color: 'bg-primary-container text-on-primary-container', rotate: '-rotate-6' },
  { id: 'eco', name: 'Eco-Warrior', icon: Leaf, color: 'bg-tertiary-container text-on-tertiary-container', rotate: 'rotate-12' },
  { id: 'legend', name: 'Laundry Legend', icon: Lock, color: 'bg-surface-container opacity-40', locked: true }
];

const history = [
  { id: 1, name: 'Full Wash & Fold', date: 'Oct 24 • Delivered', price: '₦14,500' },
  { id: 2, name: 'Express Dry', date: 'Oct 18 • Delivered', price: '₦6,200' }
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [totalWashes, setTotalWashes] = React.useState(0);

  React.useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const filtered = allOrders.filter((o: any) => o.customerPhone === user?.phoneNumber);
    setRecentOrders(filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTotalWashes(filtered.filter((o: any) => o.status === 'Delivered').length);
  }, [user]);

  const earnedBadges = [
    { 
      id: 'clean', 
      name: 'Always Clean', 
      icon: Droplets, 
      color: 'bg-primary/10 text-primary', 
      earned: recentOrders.filter(o => o.status === 'Delivered').length >= 5,
      criteria: 'Complete 5 orders without any disputes.' 
    },
    { 
      id: 'early', 
      name: 'Early Bird', 
      icon: Sun, 
      color: 'bg-warning/10 text-warning', 
      earned: recentOrders.some(o => new Date(o.createdAt).getHours() < 8),
      criteria: 'Place an order before 8 AM.' 
    },
    { 
      id: 'loyal', 
      name: 'Loyal Customer', 
      icon: Shield, 
      color: 'bg-tertiary/10 text-tertiary', 
      earned: recentOrders.length > 0 && (new Date().getTime() - new Date(recentOrders[recentOrders.length - 1].createdAt).getTime() > 30 * 24 * 60 * 60 * 1000),
      criteria: 'Stay with us for over 1 month.' 
    },
    { 
      id: 'new', 
      name: 'Newcomer', 
      icon: Leaf, 
      color: 'bg-success/10 text-success', 
      earned: true, 
      criteria: 'Welcome to Quick-Wash!' 
    }
  ];

  return (
    <div className="pb-32">
      <TopAppBar title="My Profile" showAudioToggle />

      <main className="pt-8 px-6 max-w-2xl mx-auto space-y-8">
        <section className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container shadow-sm relative">
              <Image 
                src={`https://picsum.photos/seed/${user?.phoneNumber}/200/200`} 
                alt="User Profile"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-1.5 rounded-full shadow-lg">
              <Verified className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">{user?.fullName || 'User'}</h2>
            <p className="font-label text-sm text-on-surface-variant">{user?.phoneNumber}</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {user?.trustPoints && user.trustPoints >= 500 ? 'Elite User' : 'Standard User'}
              </span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-3 rounded-2xl bg-error/5 text-error hover:bg-error/10 transition-colors active:scale-95"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-sm relative overflow-hidden">
            <Shield className="absolute top-4 right-4 text-primary/10 w-10 h-10" />
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle className="text-surface-container-low" cx="80" cy="80" fill="none" r="70" stroke="currentColor" strokeWidth="12" />
                <circle className="text-primary" cx="80" cy="80" fill="none" r="70" stroke="currentColor" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * (user?.trustPoints || 0) / 1000)} strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <span className="block text-5xl font-headline font-extrabold text-primary">{user?.trustPoints || 0}</span>
                <span className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Trust Points</span>
              </div>
            </div>
            <p className="text-center text-sm font-medium text-on-surface-variant px-4">
              {user?.trustPoints && user.trustPoints >= 500 ? "You're Elite status! Your orders get priority pickup." : "Keep using Quick-Wash to reach Elite status!"}
            </p>
          </section>

          <div className="grid grid-rows-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-[2rem] flex items-center justify-between">
              <div>
                <p className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Total Washes</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">{totalWashes}</h3>
              </div>
              <div className="bg-primary-container p-3 rounded-2xl">
                <Droplets className="text-on-primary-container w-6 h-6 fill-current" />
              </div>
            </div>
            <div className="bg-primary p-6 rounded-[2rem] text-on-primary flex flex-col justify-between overflow-hidden relative group">
              <div className="z-10">
                <p className="font-label text-[10px] uppercase font-bold tracking-widest opacity-80">Wallet Balance</p>
                <h3 className="text-3xl font-headline font-bold leading-tight mt-1">₦{(user?.walletBalance || 0).toLocaleString()}</h3>
              </div>
              <Link href="/wallet" className="z-10 mt-2 bg-on-primary text-primary font-label font-bold text-xs py-2 px-4 rounded-xl w-max active:scale-95 transition-transform">
                Withdraw
              </Link>
              <Shield className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
            </div>
            <div className="bg-secondary p-6 rounded-[2rem] text-on-secondary flex flex-col justify-between overflow-hidden relative group">
              <div className="z-10">
                <p className="font-label text-[10px] uppercase font-bold tracking-widest opacity-80">Invite Friends</p>
                <h3 className="text-xl font-headline font-bold leading-tight mt-1">Get ₦1,000 Credit</h3>
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
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {earnedBadges.map(badge => (
              <div 
                key={badge.id} 
                className="flex-shrink-0 w-24 flex flex-col items-center space-y-2 cursor-pointer relative group"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", badge.color, !badge.earned && "opacity-40")}>
                  <badge.icon className="w-8 h-8 fill-current" />
                </div>
                <span className="text-[10px] font-label font-bold text-center leading-tight">{badge.name}</span>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-4 bg-surface-container-highest rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-primary/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{badge.name}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant leading-relaxed">{badge.criteria}</p>
                  <div className="mt-2 pt-2 border-t border-primary/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
                      Status: <span className={badge.earned ? "text-success" : "text-error"}>{badge.earned ? "Earned ✅" : "Locked 🔒"}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-headline font-bold">Recent History</h3>
          <div className="space-y-3">
            {recentOrders.slice(0, 5).map(item => (
              <Link key={item.id} href={`/track/${item.id}`} className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-highest transition-colors">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <CheckCircle className={cn("w-6 h-6 fill-current", item.status === 'Delivered' ? "text-success" : "text-primary")} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-headline font-bold text-sm line-clamp-1">{item.items}</h4>
                    <span className="font-label text-[10px] font-bold text-on-surface-variant">₦{(item.totalPrice || 0).toLocaleString()}</span>
                  </div>
                  <p className="font-label text-[10px] text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()} • {item.status}</p>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-center text-on-surface-variant py-10">No history yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
