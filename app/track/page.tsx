'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  ShoppingBag, 
  History,
  MessageSquare,
  AlertTriangle,
  Star,
  RefreshCw,
  Droplets,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, Order, UserData } from '@/lib/DatabaseService';
import { Toast } from '@/components/shared/Toast';

const STATUS_MAP: Record<string, { label: string; desc: string; icon: any }> = {
  'pending': { label: 'Paid', desc: 'Finding a nearby rider...', icon: Clock },
  'rider_assign_pickup': { label: 'Rider Assigned', desc: 'Rider is on the way to you.', icon: MapPin },
  'picked_up': { label: 'In Transit', desc: 'Rider has your clothes, going to vendor.', icon: Zap },
  'washing': { label: 'Washing', desc: 'Vendor is cleaning your clothes.', icon: Droplets },
  'ready': { label: 'Ready', desc: 'All cleaned! Finding a delivery rider...', icon: CheckCircle2 },
  'rider_assign_delivery': { label: 'Delivery Assigned', desc: 'Rider is picking up from vendor.', icon: Zap },
  'out_for_delivery': { label: 'Out for Delivery', desc: 'Rider is on the way to your hostel.', icon: MapPin },
  'completed': { label: 'Delivered', desc: 'Enjoy your clean clothes!', icon: ShieldCheck },
};

const STEPS = ['pending', 'rider_assign_pickup', 'picked_up', 'washing', 'ready', 'rider_assign_delivery', 'out_for_delivery', 'completed'];

export default function TrackPage() {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<UserData | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchOrders = React.useCallback(async (user: any) => {
    try {
      const data = await db.getOrders();
      // Filter for customer orders
      const customerOrders = data.filter((o: Order) => o.customerUid === user.uid);
      setOrders(customerOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('qw_user');
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    fetchOrders(user);

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => fetchOrders(user), 15000);
    return () => clearInterval(interval);
  }, [router, fetchOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (currentUser) fetchOrders(currentUser);
  };

  const handleDispute = async (orderId: string) => {
    const reason = prompt("Describe the issue with your order:");
    if (!reason) return;
    
    try {
      await db.submitDispute(orderId, { issueDescription: reason });
      setNotification({ message: 'Dispute submitted. Admin will review.', type: 'info' });
      if (currentUser) fetchOrders(currentUser);
    } catch (e) {
      setNotification({ message: 'Failed to submit dispute.', type: 'error' });
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="pt-16 px-6 pb-8 border-b-2 border-primary/5 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">Your Journey</h1>
            <p className="text-on-surface-variant font-medium">Real-time laundry tracking.</p>
          </div>
          <button 
            onClick={handleRefresh}
            className={cn(
              "p-4 rounded-2xl bg-primary/10 text-primary transition-all active:scale-95",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-12">
        <AnimatePresence>
          {notification && (
            <Toast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
            />
          )}
        </AnimatePresence>

        {activeOrders.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-headline font-black mb-2">No active orders</h3>
            <p className="text-on-surface-variant font-medium mb-8">Ready for some fresh laundry?</p>
            <button 
              onClick={() => router.push('/vendors')}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-headline font-black shadow-xl"
            >
              Order Now
            </button>
          </div>
        )}

        {activeOrders.map((order) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 shadow-xl border border-primary/5"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", order.color)}>
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-black">Order #{order.id}</h3>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{order.vendorName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-headline font-black text-primary">₦{order.totalPrice.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Escrow Secured</p>
              </div>
            </div>

            {/* Handover Codes */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Pickup Code (From You)</p>
                <p className="text-3xl font-headline font-black tracking-widest">{order.code1}</p>
                <p className="text-[9px] font-medium text-on-surface-variant mt-2">Give to rider when they arrive.</p>
              </div>
              <div className="bg-tertiary/5 p-4 rounded-2xl border border-tertiary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">Handover Code (To You)</p>
                <p className="text-3xl font-headline font-black tracking-widest">{order.status === 'out_for_delivery' ? '****' : order.code4 || '---'}</p>
                <p className="text-[9px] font-medium text-on-surface-variant mt-2">Enter when you receive items.</p>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                  {STATUS_MAP[order.status]?.icon && (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      {React.createElement(STATUS_MAP[order.status].icon, { className: "w-5 h-5" })}
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-headline font-black text-primary">{STATUS_MAP[order.status]?.label || order.status}</h4>
                    <p className="text-xs font-medium text-on-surface-variant">{STATUS_MAP[order.status]?.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">
                  Step {STEPS.indexOf(order.status) + 1} of 8
                </span>
              </div>
              
              <div className="h-3 bg-surface-container rounded-full overflow-hidden flex gap-0.5">
                {STEPS.map((step, idx) => {
                  const isActive = STEPS.indexOf(order.status) >= idx;
                  return (
                    <div 
                      key={step} 
                      className={cn(
                        "flex-1 h-full transition-all duration-1000",
                        isActive ? "bg-primary" : "bg-primary/5"
                      )} 
                    />
                  );
                })}
              </div>
            </div>

            <div className="border-t border-primary/5 pt-6 flex flex-wrap gap-4">
              <button 
                onClick={() => handleDispute(order.id)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-error/10 text-error font-headline font-bold text-xs uppercase tracking-widest"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Issue
              </button>
              <button 
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/5 text-primary font-headline font-bold text-xs uppercase tracking-widest ml-auto"
              >
                <MessageSquare className="w-4 h-4" />
                Chat Rider
              </button>
            </div>
          </motion.div>
        ))}

        {pastOrders.length > 0 && (
          <section className="pt-12">
            <h3 className="text-2xl font-headline font-black mb-8 px-2">Order History</h3>
            <div className="space-y-4">
              {pastOrders.map(order => (
                <div key={order.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-surface-container-highest flex items-center justify-center opacity-40">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black text-sm">Order #{order.id}</h4>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {order.status === 'completed' ? `Delivered by ${order.riderName}` : 'Cancelled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="font-headline font-black text-sm">₦{order.totalPrice.toLocaleString()}</p>
                    </div>
                    {order.status === 'completed' && !order.rating && (
                      <button className="p-3 rounded-xl bg-primary/10 text-primary active:scale-95 transition-all">
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
