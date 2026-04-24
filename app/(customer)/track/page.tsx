'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { MapPin, Package, Clock, ChevronRight, Search, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { db, Order, UserData } from '@/lib/DatabaseService';

export default function TrackListPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [timeRange, setTimeRange] = React.useState<'today' | '7d' | '14d' | '30d' | '2m' | 'custom'>('30d');
  const [customRange, setCustomRange] = React.useState({ start: '', end: '' });

  React.useEffect(() => {
    const init = async () => {
      const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
      if (!currentUser.uid) return;
      
      const me = await db.getUser(currentUser.uid);
      setUser(me);

      if (me?.uid) {
        // Filter orders for current customer - STRICT UID FILTERING
        const allOrders = await db.getOrders();
        const customerOrders = allOrders.filter((o: Order) => o.customerUid === me.uid);
        setOrders(customerOrders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    };
    init();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-success/10 text-success';
      case 'Cancelled (Auto)': return 'bg-error/10 text-error';
      case 'Awaiting Pickup Confirmation':
      case 'Awaiting Delivery Confirmation': return 'bg-warning/10 text-warning';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="pb-32">
        <TopAppBar />
        
        <main className="pt-8 px-6 max-w-2xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter mb-2">Track Orders</h1>
            <p className="text-on-surface-variant font-medium">View and track your active and past laundry orders.</p>
          </header>

          <div className="mb-8 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '14d', label: '14 Days' },
                { id: '30d', label: '30 Days' },
                { id: '2m', label: '2 Months' },
                { id: 'custom', label: 'Customize' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeRange(opt.id as any)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest transition-all",
                    timeRange === opt.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {timeRange === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">Start Date</label>
                    <input 
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-white rounded-lg p-2 text-xs font-bold outline-none border border-primary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">End Date</label>
                    <input 
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-white rounded-lg p-2 text-xs font-bold outline-none border border-primary/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            {(() => {
              const now = new Date();
              const filteredOrders = orders.filter((o: any) => {
                const itemDate = new Date(o.createdAt);
                if (timeRange === 'today') return itemDate.toDateString() === now.toDateString();
                if (timeRange === 'custom') {
                  if (!customRange.start || !customRange.end) return true;
                  const start = new Date(customRange.start);
                  const end = new Date(customRange.end);
                  end.setHours(23, 59, 59, 999);
                  return itemDate >= start && itemDate <= end;
                }

                const diffInDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
                if (timeRange === '7d') return diffInDays <= 7;
                if (timeRange === '14d') return diffInDays <= 14;
                if (timeRange === '30d') return diffInDays <= 30;
                if (timeRange === '2m') return diffInDays <= 60;
                return true;
              });

              if (filteredOrders.length > 0) {
                return filteredOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link 
                      href={`/track/${order.id}`}
                      className="block bg-surface-container-low rounded-[2rem] p-6 border border-primary/5 hover:border-primary/20 transition-all active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-headline font-black text-lg text-on-surface">Order #{order.id}</h3>
                            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                              {new Date(order.createdAt).toLocaleDateString()} • {order.items.split(',')[0]}...
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-4 py-2 rounded-full font-label text-[10px] font-black uppercase tracking-widest",
                          getStatusColor(order.status)
                        )}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold">{order.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary font-headline font-black">
                          <span>Track Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ));
              }

              return (
                <div className="py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-primary/20">
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-10 h-10 text-primary/20" />
                  </div>
                  <h4 className="font-headline font-black text-on-surface">{orders.length > 0 ? 'No results found' : 'No orders found'}</h4>
                  <p className="text-xs font-medium text-on-surface-variant mt-1">
                    {orders.length > 0 ? 'Try adjusting your filters to see more results.' : 'You haven\'t placed any orders yet.'}
                  </p>
                  {orders.length === 0 && (
                    <Link 
                      href="/vendors"
                      className="mt-8 inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-black shadow-xl active:scale-95 transition-all"
                    >
                      START WASHING
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
