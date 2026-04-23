'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bike, 
  MapPin, 
  ShoppingBag, 
  CheckCircle2, 
  Wallet, 
  History, 
  Settings, 
  Zap, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  Navigation,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { db, Order, UserData } from '@/lib/DatabaseService';
import { Toast } from '@/components/shared/Toast';

export default function RiderDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'active' | 'wallet' | 'settings'>('tasks');
  const [availableOrders, setAvailableOrders] = React.useState<Order[]>([]);
  const [myOrders, setMyOrders] = React.useState<Order[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [handoverCode, setHandoverCode] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const fetchOrders = React.useCallback(async (u: UserData) => {
    try {
      const data = await db.getOrders();
      // Available orders: pending or ready
      setAvailableOrders(data.filter(o => (o.status === 'pending' || o.status === 'ready') && !o.riderUid));
      // My orders: assigned to this rider and not completed/cancelled
      setMyOrders(data.filter(o => o.riderUid === u.uid && o.status !== 'completed' && o.status !== 'cancelled'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem('qw_user');
    if (!stored) { router.push('/auth'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'rider') { router.push('/'); return; }
    setUser(u);
    fetchOrders(u);

    const interval = setInterval(() => fetchOrders(u), 15000);
    return () => clearInterval(interval);
  }, [router, fetchOrders]);

  const handleClaim = async (orderId: string) => {
    if (!user) return;
    try {
      setProcessingId(orderId);
      await db.claimOrder(orderId, user.uid, user.fullName, user.phoneNumber);
      setNotification({ message: 'Order claimed! Go for pickup.', type: 'success' });
      fetchOrders(user);
    } catch (err: any) {
      setNotification({ message: err.message || 'Claim failed', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, code: string) => {
    try {
      setProcessingId(orderId);
      await db.updateOrderStatus(orderId, status, 'bg-primary', code);
      setNotification({ message: `Handover successful! Status: ${status}`, type: 'success' });
      setHandoverCode('');
      if (user) fetchOrders(user);
    } catch (err: any) {
      setNotification({ message: err.message || 'Verification failed', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Bike className="w-8 h-8 animate-spin text-primary" /></div>;

  const currentTask = myOrders[0]; // Rider handles one main task at a time for focus

  return (
    <div className="min-h-screen bg-surface">
      {/* Dynamic Background Gradient based on task status */}
      <div className={cn(
        "fixed inset-0 h-1/2 transition-colors duration-1000 -z-10 blur-[100px] opacity-20",
        currentTask ? "bg-primary" : "bg-white"
      )} />

      <header className="pt-16 px-6 pb-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-on-surface">
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tighter">Rider Hub</h1>
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">Status: {user?.isApproved ? 'Active & Vetted' : 'Awaiting Approval'}</p>
          </div>
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white overflow-hidden bg-surface-container shadow-sm relative">
                 <Image src={`https://picsum.photos/seed/rider${i}/100/100`} alt="Rider" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32">
        <AnimatePresence>
          {notification && (
            <Toast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Current Active Task */}
          <div className="lg:col-span-8">
            {currentTask ? (
              <motion.div 
                layoutId="active-task"
                className="bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-primary/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                         <Zap className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-4xl font-headline font-black tracking-tighter">Current Journey</h2>
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                           <Clock className="w-3 h-3" />
                           Priority Task
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Fee</p>
                       <p className="text-3xl font-headline font-black text-primary">₦{currentTask.riderFee.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progressive Handover Card */}
                  <div className="bg-surface-container rounded-[2.5rem] p-8 mb-10 border border-primary/10 shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                       <ShieldCheck className="w-6 h-6 text-primary" />
                       <h3 className="font-headline font-black text-xl uppercase tracking-tight">Security Checkpoint</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Step Identification */}
                      <div className="p-6 bg-white rounded-3xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-4">
                          Next Action: {
                            currentTask.status === 'rider_assign_pickup' ? 'PICKUP FROM CUSTOMER' :
                            currentTask.status === 'picked_up' ? 'DELIVER TO VENDOR' :
                            currentTask.status === 'rider_assign_delivery' ? 'PICKUP FROM VENDOR' :
                            currentTask.status === 'out_for_delivery' ? 'FINAL DELIVERY TO CUSTOMER' : '...'
                          }
                        </p>
                        
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-headline font-black text-on-surface mb-0.5 leading-tight">
                              {currentTask.status === 'rider_assign_pickup' ? (currentTask.customerLandmark || 'Customer Location') : 
                               (currentTask.status === 'picked_up' || currentTask.status === 'rider_assign_delivery') ? (currentTask.vendorLandmark || 'Vendor Location') :
                               currentTask.customerLandmark || 'Final Destination'
                              }
                            </p>
                            <p className="text-xs font-medium text-on-surface-variant leading-tight">
                               {currentTask.status === 'rider_assign_pickup' ? currentTask.customerAddress : 
                                (currentTask.status === 'picked_up' || currentTask.status === 'rider_assign_delivery') ? currentTask.vendorAddress :
                                currentTask.customerAddress
                               }
                            </p>
                          </div>
                          <button className="w-14 h-14 rounded-2xl bg-on-surface text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                             <Navigation className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <input 
                            type="text" 
                            placeholder="Enter Code to Confirm Handover"
                            value={currentTask.id === processingId ? handoverCode : ''}
                            onChange={(e) => {
                              setProcessingId(currentTask.id);
                              setHandoverCode(e.target.value.toUpperCase());
                            }}
                            className="w-full h-16 bg-surface-container rounded-2xl px-8 font-headline font-black text-center text-3xl tracking-widest outline-none focus:ring-4 ring-primary/20 transition-all border border-primary/10"
                          />
                          <button
                            disabled={!handoverCode || processingId !== currentTask.id}
                            onClick={() => {
                              const nextStatusMap: Record<string, string> = {
                                'rider_assign_pickup': 'picked_up',
                                'picked_up': 'washing',
                                'rider_assign_delivery': 'out_for_delivery',
                                'out_for_delivery': 'completed'
                              };
                              handleUpdateStatus(currentTask.id, nextStatusMap[currentTask.status], handoverCode);
                            }}
                            className="w-full h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            VERIFY HANDOVER
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 h-14 bg-surface-container rounded-2xl flex items-center justify-center gap-2 border border-primary/5 active:scale-95 transition-all">
                       <Phone className="w-4 h-4" />
                       <span className="font-headline font-black text-xs uppercase tracking-widest">Call {currentTask.status.includes('pickup') ? 'Customer' : 'Vendor'}</span>
                    </button>
                    <button className="px-8 h-14 bg-error/10 text-error rounded-2xl flex items-center justify-center font-headline font-black text-xs uppercase tracking-widest border border-error/20 active:scale-95 transition-all">
                       Abandon
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-primary/20">
                 <Bike className="w-16 h-16 text-primary/20 mx-auto mb-6" />
                 <h3 className="text-2xl font-headline font-black opacity-40">No active journey.</h3>
                 <p className="text-on-surface-variant font-medium text-xs uppercase tracking-widest mt-2">Claim a task from the available list</p>
              </div>
            )}
          </div>

          {/* Right Column: Mini Stats & Tabs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-700" />
               <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Total Earnings</h4>
               <p className="text-5xl font-headline font-black mb-6 tracking-tighter text-vibrant">₦{user?.walletBalance.toLocaleString()}</p>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 w-fit px-3 py-1 rounded-full">
                 <TrendingUp className="w-3 h-3" />
                 Elite Rating: 98%
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-headline font-black uppercase tracking-widest text-on-surface-variant px-2">Available Task Pool</h3>
              <AnimatePresence>
                {availableOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white/50 rounded-3xl border border-primary/5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                    No tasks found. Relax for a bit!
                  </div>
                ) : (
                  availableOrders.map(order => (
                    <motion.div 
                      key={order.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-6 rounded-3xl shadow-md border border-primary/5 hover:border-primary/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            order.status === 'ready' ? "bg-secondary text-white" : "bg-primary/10 text-primary"
                          )}>
                             {order.status === 'ready' ? <Zap className="w-5 h-5 fill-current" /> : <ShoppingBag className="w-5 h-5" />}
                          </div>
                          <div>
                            <h5 className="font-headline font-black text-sm uppercase">Order #{order.id}</h5>
                            <p className="text-[10px] font-bold text-on-surface-variant">{order.status === 'ready' ? 'Delivery Task' : 'Pickup Task'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-black text-primary">₦{order.riderFee.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-6">
                         <div className="flex-1 bg-surface-container rounded-xl p-3">
                            <p className="text-[8px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Destination</p>
                            <p className="font-headline font-black text-[10px] line-clamp-1">{order.status === 'ready' ? order.customerLandmark : order.vendorLandmark}</p>
                         </div>
                         <div className="flex-1 bg-surface-container rounded-xl p-3">
                            <p className="text-[8px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Time</p>
                            <p className="font-headline font-black text-[10px]">Express</p>
                         </div>
                      </div>

                      <button 
                        onClick={() => handleClaim(order.id)}
                        disabled={!!currentTask || processingId === order.id}
                        className="w-full h-12 bg-on-surface text-white rounded-xl font-headline font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                         {processingId === order.id ? 'Claiming...' : 'Claim Task Now'}
                         <ArrowRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Bottom Nav Overlay */}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center z-[100] lg:hidden">
          <div className="bg-zinc-900 backdrop-blur-2xl px-8 py-3 rounded-[2rem] flex gap-8 shadow-2xl border border-white/5">
              {[
                { icon: Bike, id: 'tasks' },
                { icon: History, id: 'history' },
                { icon: Wallet, id: 'wallet' },
                { icon: Settings, id: 'settings' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    activeTab === t.id ? "bg-primary text-white" : "text-white/40"
                  )}
                >
                  <t.icon className="w-6 h-6" />
                </button>
              ))}
          </div>
      </div>
    </div>
  );
}
