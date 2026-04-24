'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Clock, 
  Droplets, 
  CheckCircle2, 
  Tag, 
  Settings, 
  Wallet, 
  Plus, 
  ChevronRight,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, Order, UserData } from '@/lib/DatabaseService';
import { useAuth } from '@/hooks/use-auth';
import { Toast } from '@/components/shared/Toast';

export default function VendorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'active' | 'prices' | 'wallet' | 'settings'>('active');
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [handoverCode, setHandoverCode] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const fetchOrders = React.useCallback(async (u: UserData) => {
    try {
      const data = await db.getOrders();
      setOrders(data.filter(o => o.vendorId === u.uid));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else if (user.role !== 'vendor') {
        router.push('/');
      } else {
        fetchOrders(user);
      }
    }
  }, [user, authLoading, router, fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: string, code?: string) => {
    try {
      setProcessingId(orderId);
      await db.updateOrderStatus(orderId, status, 'bg-primary', code);
      setNotification({ message: `Status updated to ${status}`, type: 'success' });
      setHandoverCode('');
      if (user) fetchOrders(user);
    } catch (err: any) {
      setNotification({ message: err.message || 'Update failed', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const currentWashes = orders.filter(o => o.status === 'washing');
  const incomingOrders = orders.filter(o => o.status === 'picked_up'); // Rider has it from customer
  const readyOrders = orders.filter(o => o.status === 'ready');
  const pendingCollection = orders.filter(o => o.status === 'rider_assign_delivery');

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Droplets className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-surface">
      <header className="pt-16 px-6 pb-24 signature-gradient text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
        <div className="max-w-7xl mx-auto flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-4xl font-headline font-black tracking-tighter mb-2">{user?.shopName}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                Verified Vendor
              </span>
              <span className="flex items-center gap-1 text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {user?.trustPoints} Points
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Available Funds</p>
            <p className="text-4xl font-headline font-black">₦{user?.walletBalance.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-32">
        <AnimatePresence>
          {notification && (
            <Toast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
            />
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
            <h4 className="text-3xl font-headline font-black text-primary mb-1">{incomingOrders.length}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">At Doorstep</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
            <h4 className="text-3xl font-headline font-black text-primary mb-1">{currentWashes.length}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">In Machines</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
            <h4 className="text-3xl font-headline font-black text-primary mb-1">{readyOrders.length}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Waiting Pickup</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
            <h4 className="text-3xl font-headline font-black text-primary mb-1">₦{user?.pendingBalance.toLocaleString()}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Escrow Balance</p>
          </div>
        </div>

        {/* Tab Logic */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: 'active', label: 'Work Orders', icon: Droplets },
            { id: 'prices', label: 'Price List', icon: Tag },
            { id: 'wallet', label: 'Earnings', icon: Wallet },
            { id: 'settings', label: 'Shop Settings', icon: Settings }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-headline font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === t.id ? "bg-primary text-white shadow-xl" : "bg-white text-on-surface-variant border border-primary/5"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'active' && (
          <div className="space-y-8">
            {/* Incoming Orders from Riders */}
            {incomingOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <h3 className="text-sm font-headline font-black uppercase tracking-widest text-on-surface-variant">Incoming Deliveries</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingOrders.map(order => (
                    <motion.div 
                      key={order.id} 
                      className="bg-white p-8 rounded-[2.5rem] shadow-lg border-2 border-secondary/20"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">Action Required</p>
                          <h4 className="text-xl font-headline font-black">Order #{order.id}</h4>
                          <p className="text-xs font-medium text-on-surface-variant">{order.items}</p>
                        </div>
                        <div className="bg-secondary/10 p-3 rounded-2xl text-secondary">
                          <Zap className="w-6 h-6" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Enter Receiver Code 2"
                          value={order.id === processingId ? handoverCode : ''}
                          onChange={(e) => {
                            setProcessingId(order.id);
                            setHandoverCode(e.target.value.toUpperCase());
                          }}
                          className="w-full h-14 bg-surface-container rounded-2xl px-6 font-headline font-black text-center text-lg outline-none focus:ring-2 ring-secondary transition-all"
                        />
                        <button 
                          disabled={!handoverCode || processingId !== order.id}
                          onClick={() => handleUpdateStatus(order.id, 'washing', handoverCode)}
                          className="w-full h-14 bg-secondary text-white rounded-2xl font-headline font-black shadow-lg disabled:opacity-50"
                        >
                          RECEIVE BAG & START WASH
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Current Washes */}
            <section>
              <h3 className="text-sm font-headline font-black uppercase tracking-widest text-on-surface-variant mb-4 px-2">Currently Washing</h3>
              {currentWashes.length === 0 && <div className="p-12 text-center bg-white rounded-[3rem] border border-dashed border-primary/20 opacity-40 font-headline font-black">No bags in machines</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentWashes.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-pulse">
                        <Droplets className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-headline font-black">Order #{order.id}</h4>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Customer: {order.customerName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-headline font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      MARK READY
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Ready & Waiting */}
            {(readyOrders.length > 0 || pendingCollection.length > 0) && (
              <section>
                <h3 className="text-sm font-headline font-black uppercase tracking-widest text-on-surface-variant mb-4 px-2">Ready for Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...readyOrders, ...pendingCollection].map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5 border-l-4 border-l-green-500">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-headline font-black">Order #{order.id}</h4>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="bg-surface-container p-4 rounded-xl mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Handover Code 3</p>
                        <p className="text-2xl font-headline font-black tracking-[0.5em] text-primary">{order.code3 || '---'}</p>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {order.status === 'ready' ? 'Waiting for rider to claim...' : `Assigned to ${order.riderName}`}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        
        {activeTab === 'prices' && (
          <div className="bg-white rounded-[3rem] p-12 text-center shadow-xl">
             <Tag className="w-16 h-16 text-primary/20 mx-auto mb-6" />
             <h3 className="text-3xl font-headline font-black mb-2">Price List Management</h3>
             <p className="text-on-surface-variant font-medium mb-8">Update your rates for different types of clothing.</p>
             <button className="px-8 py-4 bg-primary text-white rounded-2xl font-headline font-black shadow-lg">Load Editor</button>
          </div>
        )}
      </main>
    </div>
  );
}
