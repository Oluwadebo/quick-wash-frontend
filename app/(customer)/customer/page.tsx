'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import LandmarkSelector from '@/components/shared/LandmarkSelector';
import { Search, MapPin, ChevronRight, Plus, HelpCircle, Zap, ShoppingBag, Sun, Leaf, Handshake, Shield, Droplets } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { db, Order, UserData } from '@/lib/DatabaseService';

export default function LandmarkSelectionPage() {
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [pendingCart, setPendingCart] = React.useState<any[]>([]);
  const [unconfirmedOrder, setUnconfirmedOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    const init = async () => {
      const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
      if (!currentUser.uid) return;
      
      const me = await db.getUser(currentUser.uid);
      setUser(me);

      if (me?.uid) {
        const savedCart = localStorage.getItem(`qw_pending_cart_${me.uid}`);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (parsed.some((i: any) => i.count > 0)) {
            setPendingCart(parsed);
          }
        }

        // Check for paid but unconfirmed order - STRICT UID FILTERING
        const allOrders = await db.getOrders();
        const unconfirmed = allOrders.find((o: Order) => 
          o.customerUid === me.uid && 
          o.status === 'confirm'
        );
        setUnconfirmedOrder(unconfirmed || null);

        const filtered = allOrders.filter((o: Order) => o.customerUid === me.uid);
        setRecentOrders(filtered.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      const activeAlerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
      setAlerts(activeAlerts.filter((a: any) => a.type === 'Weather'));
    };
    init();
  }, []);

  const allBadges = [
    { 
      id: 'clean', 
      name: 'Always Clean', 
      icon: Droplets, 
      color: 'bg-primary/10 text-primary', 
      earned: recentOrders.filter(o => o.status === 'completed').length >= 5,
      progress: recentOrders.filter(o => o.status === 'completed').length,
      goal: 5,
      reward: '+10% Trust Points',
      criteria: 'Complete 5 orders with "No Issue" reported.' 
    },
    { 
      id: 'early', 
      name: 'Early Bird', 
      icon: Sun, 
      color: 'bg-warning/10 text-warning', 
      earned: recentOrders.some(o => new Date(o.createdAt).getHours() < 8),
      progress: recentOrders.some(o => new Date(o.createdAt).getHours() < 8) ? 1 : 0,
      goal: 1,
      reward: '+5% Trust Points',
      criteria: 'Place an order before 8 AM.' 
    },
    { 
      id: 'loyal', 
      name: 'Loyal Customer', 
      icon: Shield, 
      color: 'bg-tertiary/10 text-tertiary', 
      earned: recentOrders.length > 0 && (new Date().getTime() - new Date(recentOrders[recentOrders.length - 1].createdAt).getTime() > 30 * 24 * 60 * 60 * 1000),
      progress: recentOrders.length > 0 ? Math.floor((new Date().getTime() - new Date(recentOrders[recentOrders.length - 1].createdAt).getTime()) / (24 * 60 * 60 * 1000)) : 0,
      goal: 30,
      reward: '+15% Trust Points',
      criteria: 'Stay active with us for over 30 days.' 
    },
    { 
      id: 'new', 
      name: 'Newcomer', 
      icon: Leaf, 
      color: 'bg-success/10 text-success', 
      earned: true, 
      progress: 1,
      goal: 1,
      reward: '+2% Trust Points',
      criteria: 'Complete your first registration.' 
    }
  ];

  const [showAllBadges, setShowAllBadges] = React.useState(false);
  const badgesToDisplay = showAllBadges ? allBadges : allBadges.filter(b => b.earned);

  return (
    <div className="pb-32">
      <TopAppBar />
      
      <main className="pt-8 px-6 max-w-2xl mx-auto">
          {/* Resume Order Alert */}
          {pendingCart.length > 0 && !unconfirmedOrder && (
            <motion.section 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-primary/10 border-2 border-primary/20 p-6 rounded-[2.5rem] flex items-center justify-between gap-4 shadow-xl shadow-primary/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-headline font-black text-primary text-lg leading-tight">Unfinished Order</h4>
                  <p className="text-xs font-bold text-on-surface-variant">You have items in your cart. Continue now?</p>
                </div>
              </div>
              <Link 
                href="/order"
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-headline font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                RESUME
              </Link>
            </motion.section>
          )}

          {/* Paid but Unconfirmed Alert */}
          {unconfirmedOrder && (
            <motion.section 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-warning/10 border-2 border-warning/20 p-6 rounded-[2.5rem] flex items-center justify-between gap-4 shadow-xl shadow-warning/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-warning text-on-warning-container flex items-center justify-center shrink-0 shadow-lg">
                  <Zap className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <h4 className="font-headline font-black text-warning-dark text-lg leading-tight">Action Required</h4>
                  <p className="text-xs font-bold text-on-surface-variant">Order #{unconfirmedOrder.id} is paid. Click ready!</p>
                </div>
              </div>
              <Link 
                href={`/order?vendor=${unconfirmedOrder.vendorId}`}
                className="px-6 py-3 bg-warning text-on-warning-container rounded-xl font-headline font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                COMPLETE
              </Link>
            </motion.section>
          )}

          {/* Weather Alerts */}
          {alerts.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-error/10 border border-error/20 p-6 rounded-[2rem] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-error text-white flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-headline font-black text-error text-sm uppercase tracking-widest">Weather Alert</h4>
                <p className="text-xs font-medium text-on-surface-variant">{alerts[0].msg}</p>
              </div>
            </motion.section>
          )}

          {/* Trust Points Header */}
        <section className="mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center shadow-lg">
                <Zap className="text-on-tertiary-container w-8 h-8 fill-current" />
              </div>
              <div>
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Your Trust Status</p>
                <h3 className="text-2xl font-headline font-black text-on-surface">
                  {user?.trustPoints || 0} Points • <span className="text-tertiary">{(user?.trustPoints || 0) >= 500 ? 'Elite' : 'Standard'}</span>
                </h3>
              </div>
            </div>
            <Link href="/profile" className="p-4 rounded-2xl bg-white shadow-sm hover:bg-primary-container transition-colors">
              <ChevronRight className="text-primary w-6 h-6" />
            </Link>
          </motion.div>
        </section>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Your Recent Orders</h3>
              <Link href="/track" className="text-primary font-headline font-bold text-xs">View All</Link>
            </div>
            <div className="space-y-4">
              {recentOrders.slice(0, 2).map((order) => (
                <Link 
                  key={order.id} 
                  href={`/track/${order.id}`}
                  className="block bg-surface-container-low p-6 rounded-3xl border border-primary/5 hover:border-primary/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", order.color)}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium line-clamp-1">{order.items}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Your Achievements */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Your Achievements</h3>
            <button 
              onClick={() => setShowAllBadges(!showAllBadges)}
              className="text-primary font-headline font-bold text-xs"
            >
              {showAllBadges ? 'Show Earned' : 'View All'}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar">
            {badgesToDisplay.map((badge) => (
              <div 
                key={badge.id} 
                className="flex-shrink-0 w-24 flex flex-col items-center space-y-3 cursor-pointer relative group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", 
                  badge.earned ? badge.color : "bg-surface-container-highest grayscale opacity-40"
                )}>
                  <badge.icon className="w-8 h-8 fill-current" />
                </div>
                <span className={cn(
                  "text-[10px] font-label font-bold text-center leading-tight",
                  badge.earned ? "text-on-surface" : "text-on-surface-variant opacity-40"
                )}>
                  {badge.name}
                </span>
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-56 p-5 bg-surface-container-high rounded-[2rem] shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 border border-primary/10">
                  <p className="text-xs font-headline font-black text-on-surface mb-1">{badge.name}</p>
                  <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed mb-4">{badge.criteria}</p>
                  
                  <div className="space-y-3 pt-3 border-t border-primary/5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                      <span>Status</span>
                      <span className={cn(badge.earned ? "text-success" : "text-primary")}>
                        {badge.earned ? 'Earned ✅' : `${badge.progress}/${badge.goal}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                      <span>Reward</span>
                      <span className="text-tertiary font-bold">{badge.reward}</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-container-high" />
                </div>
              </div>
            ))}
            {badgesToDisplay.length === 0 && (
              <p className="text-xs font-medium text-on-surface-variant italic">Start washing to earn badges!</p>
            )}
          </div>
        </section>

        <header className="mb-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[3.5rem] font-headline font-black leading-tight tracking-tight text-on-surface mb-2"
          >
            Pick your spot.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant font-medium leading-relaxed max-w-sm"
          >
            We&apos;ll find the nearest wash hub around your campus area.
          </motion.p>
        </header>

        <LandmarkSelector />

        <section className="mt-12 text-center">
          <p className="text-sm text-on-surface-variant mb-6 font-medium">Don&apos;t see your area?</p>
          <button className="signature-gradient w-full h-16 rounded-3xl text-on-primary font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.95] transition-transform shadow-lg">
            <Plus className="w-6 h-6" />
            Enter Address Manually
          </button>
        </section>
      </main>
    </div>
  );
}
