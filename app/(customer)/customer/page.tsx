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

export default function LandmarkSelectionPage() {
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [pendingCart, setPendingCart] = React.useState<any[]>([]);
  const [unconfirmedOrder, setUnconfirmedOrder] = React.useState<any>(null);

  React.useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    setUser(currentUser);

    if (currentUser?.phoneNumber) {
      const savedCart = localStorage.getItem(`qw_pending_cart_${currentUser.phoneNumber}`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed.some((i: any) => i.count > 0)) {
          setPendingCart(parsed);
        }
      }

      // Check for paid but unconfirmed order
      const unconfirmed = allOrders.find((o: any) => 
        o.customerPhone === currentUser.phoneNumber && 
        o.status === 'Awaiting Pickup Confirmation'
      );
      setUnconfirmedOrder(unconfirmed);
    }

    const activeAlerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    setAlerts(activeAlerts.filter((a: any) => a.type === 'Weather'));
    
    const checkExpiredOrders = () => {
      const now = new Date().getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      let changed = false;
      let refundTotal = 0;

      const updated = allOrders.map((o: any) => {
        if (o.status === 'Awaiting Pickup Confirmation' && o.paidAt) {
          const paidTime = new Date(o.paidAt).getTime();
          if (now - paidTime > thirtyMinutes) {
            changed = true;
            const refund = o.totalPrice - 200; // ₦200 cancellation fee
            refundTotal += refund;
            return { ...o, status: 'Cancelled (Auto)', color: 'bg-error text-on-error', refundAmount: refund };
          }
        }
        if (o.status === 'Awaiting Delivery Confirmation' && o.readyForDeliveryAt) {
          const readyTime = new Date(o.readyForDeliveryAt).getTime();
          if (now - readyTime > thirtyMinutes) {
            changed = true;
            const refund = o.totalPrice - 200;
            refundTotal += refund;
            return { ...o, status: 'Cancelled (Auto)', color: 'bg-error text-on-error', refundAmount: refund };
          }
        }
        return o;
      });

      if (changed) {
        localStorage.setItem('qw_orders', JSON.stringify(updated));
        
        // Update user wallet
        if (refundTotal > 0) {
          const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
          const updatedUsers = allUsers.map((u: any) => {
            if (u.phoneNumber === currentUser.phoneNumber) {
              const newBalance = (u.walletBalance || 0) + refundTotal;
              // Update local user state too
              const updatedUser = { ...u, walletBalance: newBalance };
              localStorage.setItem('qw_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              return updatedUser;
            }
            return u;
          });
          localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));
          alert(`Some orders were auto-cancelled due to inactivity. ₦${refundTotal} has been refunded to your wallet.`);
        }

        return updated.filter((o: any) => o.customerPhone === currentUser.phoneNumber);
      }
      return allOrders.filter((o: any) => o.customerPhone === currentUser.phoneNumber);
    };

    const filtered = checkExpiredOrders();
    setRecentOrders(filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

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
                  {user?.trustPoints || 0} Points • <span className="text-tertiary">{user?.trustPoints >= 500 ? 'Elite' : 'Standard'}</span>
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

        {/* Earned Badges */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Your Earned Badges</h3>
            <Link href="/profile" className="text-primary font-headline font-bold text-xs">View All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {[
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
            ].map((badge) => (
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
