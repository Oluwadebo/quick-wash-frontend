'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { MapPin, Package, Clock, ChevronRight, Search, History } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { db, Order, UserData } from '@/lib/DatabaseService';

export default function TrackListPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);

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

          <div className="space-y-6">
            {orders.length > 0 ? (
              orders.map((order, idx) => (
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
              ))
            ) : (
              <div className="py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-primary/20">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                  <History className="text-primary/20 w-10 h-10" />
                </div>
                <h3 className="text-xl font-headline font-black text-on-surface mb-2">No orders found</h3>
                <p className="text-on-surface-variant font-medium mb-8">You haven&apos;t placed any orders yet.</p>
                <Link 
                  href="/vendors"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-black shadow-xl active:scale-95 transition-all"
                >
                  START WASHING
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
