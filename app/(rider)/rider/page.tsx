'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeTime } from '@/lib/time';
import { X, History, Wallet, ShoppingBag, MapPin, Navigation, Package, CheckCircle, Clock, Phone, ArrowRight, Bike, Zap, AlertTriangle, MessageCircle } from 'lucide-react';

export default function RiderDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'history' | 'wallet'>('tasks');
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    walletBalance: 0,
    trustScore: 100,
    completedTasks: 0
  });
  const [handoverInput, setHandoverInput] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (currentUser) {
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      
      // Tasks assigned to this rider
      const myTasks = allOrders.filter((o: any) => o.riderPhone === currentUser.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status));
      setTasks(myTasks);

      // Orders available for pickup (not yet assigned)
      const available = allOrders.filter((o: any) => o.status === 'Awaiting Pickup Confirmation' && !o.riderPhone);
      setAvailableOrders(available);

      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const me = allUsers.find((u: any) => u.phoneNumber === currentUser.phoneNumber);
      
      setStats({
        walletBalance: me?.walletBalance || 0,
        trustScore: me?.trustScore || 100,
        completedTasks: allOrders.filter((o: any) => o.riderPhone === currentUser.phoneNumber && o.status === 'Delivered').length
      });
    }
  }, [currentUser]);

  const handleAcceptOrder = (orderId: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: 'Pending Pickup', 
          riderPhone: currentUser?.phoneNumber,
          riderName: currentUser?.fullName,
          color: 'bg-primary text-on-primary'
        };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setTasks(updated.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status)));
    setAvailableOrders(updated.filter((o: any) => o.status === 'Awaiting Pickup Confirmation' && !o.riderPhone));
    alert('Order accepted! Head to the customer location.');
  };

  const handleRejectOrder = (orderId: string) => {
    if (confirm('Are you sure you want to reject this order? It will be available for other riders.')) {
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const updated = allOrders.map((o: any) => {
        if (o.id === orderId) {
          return { 
            ...o, 
            status: 'Awaiting Pickup Confirmation', 
            riderPhone: null,
            riderName: null,
            color: 'bg-warning/20 text-warning'
          };
        }
        return o;
      });
      localStorage.setItem('qw_orders', JSON.stringify(updated));
      setTasks(updated.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status)));
      setAvailableOrders(updated.filter((o: any) => o.status === 'Awaiting Pickup Confirmation' && !o.riderPhone));
      alert('Order rejected.');
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string, color: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus, color };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setTasks(updated.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status)));
  };

  const handleVerifyHandover = (order: any) => {
    const input = handoverInput[order.id];
    if (input === order.handoverCode) {
      // Final 50% rider fee to rider
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const riderFee = 1000; // Fixed + Dynamic (simulated)
      
      const updatedUsers = allUsers.map((u: any) => {
        if (u.phoneNumber === currentUser?.phoneNumber) {
          return { ...u, walletBalance: (u.walletBalance || 0) + (riderFee * 0.5) };
        }
        return u;
      });
      localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));

      // Update order status and set deliveredAt
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const updatedOrders = allOrders.map((o: any) => {
        if (o.id === order.id) {
          return { 
            ...o, 
            status: 'Delivered', 
            color: 'bg-success text-on-success',
            deliveredAt: new Date().toISOString()
          };
        }
        return o;
      });
      localStorage.setItem('qw_orders', JSON.stringify(updatedOrders));
      setTasks(updatedOrders.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status)));

      alert('Handover verified! Delivery complete. Final payment credited.');
      setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
    } else {
      alert('Invalid handover code!');
    }
  };

  const handleWithdrawal = () => {
    if (stats.walletBalance < 2000) return;
    
    const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const updated = allUsers.map((u: any) => {
      if (u.phoneNumber === currentUser?.phoneNumber) {
        return { ...u, withdrawalRequested: true };
      }
      return u;
    });
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    alert('Withdrawal request submitted! You will be paid within 2 hours.');
  };

  const handleStartNavigation = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ' Ogbomoso')}`;
    window.open(url, '_blank');
  };

  return (
    <ProtectedRoute allowedRoles={['rider']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Rider Station" showAudioToggle />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                <Bike className="text-primary w-6 h-6" />
              </div>
              <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
            </div>
            <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface mb-6 tracking-tighter">
              Welcome, {currentUser?.fullName || 'Rider'}!
            </h1>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Wallet Balance</p>
              <h3 className="text-2xl font-headline font-black text-primary">₦{(stats.walletBalance || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Trust Score</p>
              <h3 className={cn(
                "text-2xl font-headline font-black",
                stats.trustScore >= 80 ? "text-success" : stats.trustScore >= 60 ? "text-warning" : "text-error"
              )}>{stats.trustScore}%</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Completed</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">{stats.completedTasks}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Status</p>
              <h3 className="text-2xl font-headline font-black text-success uppercase tracking-tighter">Active</h3>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
            {['tasks', 'history', 'wallet'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-8 py-4 rounded-2xl font-headline font-black text-sm capitalize transition-all",
                  activeTab === tab ? "signature-gradient text-white shadow-lg" : "bg-surface-container-low text-on-surface-variant"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'tasks' && (
              <motion.section 
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Available Orders */}
                {availableOrders.length > 0 && (
                  <div>
                    <h3 className="font-headline font-black text-xl mb-6 flex items-center gap-3">
                      <Zap className="text-warning fill-current w-6 h-6" />
                      Available for Pickup
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {availableOrders.map((order) => (
                        <div key={order.id} className="bg-surface-container-low p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-xl">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="font-headline font-black text-xl text-on-surface">{order.customerName}</h4>
                              <p className="text-xs font-bold text-on-surface-variant">{order.customerLandmark}</p>
                            </div>
                            <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">₦1,000 FEE</span>
                          </div>
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="w-full h-14 signature-gradient text-white rounded-xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                          >
                            ACCEPT ORDER
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Tasks */}
                <div>
                  <h3 className="font-headline font-black text-xl mb-6">My Active Tasks</h3>
                  <div className="space-y-6">
                    {tasks.map((order) => {
                      const isPickup = order.status === 'Pending Pickup';
                      const isDelivery = order.status === 'Out for Delivery' || order.status === 'Ready for Delivery';
                      const location = isPickup ? order.customerLandmark : order.vendorName;
                      const subLocation = isPickup ? order.customerPhone : order.vendorLandmark;
                      
                      return (
                        <div key={order.id} className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center",
                                isPickup ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"
                              )}>
                                {isPickup ? <MapPin className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                              </div>
                              <div>
                                <h4 className="font-headline font-black text-xl text-on-surface">
                                  {isPickup ? 'Pickup from' : 'Deliver to'} {isPickup ? order.customerName : order.customerName}
                                </h4>
                                <p className="text-xs font-bold text-on-surface-variant">{location} • {subLocation}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                                order.color
                              )}>
                                {order.status}
                              </span>
                              {isPickup && (
                                <button 
                                  onClick={() => handleRejectOrder(order.id)}
                                  className="text-[10px] font-black uppercase tracking-widest text-error hover:underline"
                                >
                                  Reject Task
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleStartNavigation(location)}
                              className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                              <Navigation className="w-5 h-5" /> NAVIGATE
                            </button>
                            
                            {order.status === 'Pending Pickup' && (
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'Picked Up', 'bg-secondary text-on-secondary')}
                                className="flex-1 h-14 bg-primary text-on-primary rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                              >
                                CONFIRM PICKUP
                              </button>
                            )}
                            
                            {order.status === 'Ready for Delivery' && (
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'Out for Delivery', 'bg-tertiary text-on-tertiary')}
                                className="flex-1 h-14 bg-tertiary text-on-tertiary rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                              >
                                START DELIVERY
                              </button>
                            )}

                            {order.status === 'Out for Delivery' && (
                              <div className="flex-1 flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Code"
                                  value={handoverInput[order.id] || ''}
                                  onChange={(e) => setHandoverInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  className="w-24 h-14 bg-surface-container-highest rounded-xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-2 ring-primary"
                                />
                                <button 
                                  onClick={() => handleVerifyHandover(order)}
                                  className="flex-1 h-14 bg-success text-on-success rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                                >
                                  DELIVERED
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {tasks.length === 0 && availableOrders.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[3rem]">
                        <p className="text-on-surface-variant font-headline font-bold text-xl">No active tasks.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'history' && (
              <motion.section 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* History items would go here */}
                <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[3rem]">
                  <p className="text-on-surface-variant font-medium">No delivery history yet.</p>
                </div>
              </motion.section>
            )}

            {activeTab === 'wallet' && (
              <motion.section 
                key="wallet"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-primary text-on-primary p-10 rounded-[3rem] shadow-2xl shadow-primary/30">
                  <p className="font-label text-xs uppercase tracking-[0.3em] font-black mb-4 opacity-80">Rider Balance</p>
                  <h2 className="text-6xl font-headline font-black mb-8 tracking-tighter">₦{(stats.walletBalance || 0).toLocaleString()}</h2>
                  <button 
                    onClick={handleWithdrawal}
                    disabled={stats.walletBalance < 2000}
                    className="w-full h-16 bg-white text-primary rounded-2xl font-headline font-black text-lg active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {stats.walletBalance < 2000 ? 'MIN ₦2,000 REQUIRED' : 'WITHDRAW NOW'}
                  </button>
                </div>
                
                <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                  <h3 className="font-headline font-black text-xl mb-6">Withdrawal Info</h3>
                  <ul className="space-y-4 text-sm font-medium text-on-surface-variant">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      No withdrawal fees
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Paid within 2 hours
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Direct to your bank account
                    </li>
                  </ul>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ProtectedRoute>
  );
}
