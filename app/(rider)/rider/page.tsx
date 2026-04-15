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
  const [orderToReject, setOrderToReject] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      
      // Tasks assigned to this rider
      const myTasks = allOrders.filter((o: any) => o.riderPhone === currentUser.phoneNumber && !['Delivered', 'Cancelled'].includes(o.status));
      setTasks(myTasks);

      // Orders available for pickup (not yet assigned)
      // Include both Awaiting Pickup Confirmation and Pending Pickup if no rider is assigned
      const available = allOrders.filter((o: any) => {
        const isAvailable = (o.status === 'Awaiting Pickup Confirmation' || o.status === 'Pending Pickup') && !o.riderPhone;
        if (!isAvailable) return false;
        const now = new Date().getTime();
        const createdAt = new Date(o.createdAt).getTime();
        const ageInMinutes = (now - createdAt) / (1000 * 60);
        return ageInMinutes <= 20;
      });
      setAvailableOrders(available);

      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const me = allUsers.find((u: any) => u.phoneNumber === currentUser.phoneNumber);
      
      setStats({
        walletBalance: me?.walletBalance || 0,
        trustScore: me?.trustScore || 100,
        completedTasks: allOrders.filter((o: any) => o.riderPhone === currentUser.phoneNumber && o.status === 'completed').length
      });
    }
  }, [currentUser]);

  const handleAcceptOrder = (orderId: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const order = allOrders.find((o: any) => o.id === orderId);
    
    if (order) {
      const now = new Date().getTime();
      const createdAt = new Date(order.createdAt).getTime();
      const ageInMinutes = (now - createdAt) / (1000 * 60);
      
      if (ageInMinutes > 20) {
        setNotification({ message: 'Order is too old to accept (expiring soon).', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    }

    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: o.status === 'ready' ? 'rider_assign_delivery' : 'rider_assign_pickup', 
          riderPhone: currentUser?.phoneNumber,
          riderName: currentUser?.fullName,
          color: 'bg-primary text-on-primary'
        };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setTasks(updated.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['delivered', 'completed', 'Cancelled'].includes(o.status)));
    setAvailableOrders(updated.filter((o: any) => {
      const isAvailable = (o.status === 'rider_assign_pickup' || o.status === 'ready') && !o.riderPhone;
      if (!isAvailable) return false;
      const now = new Date().getTime();
      const createdAt = new Date(o.createdAt).getTime();
      const ageInMinutes = (now - createdAt) / (1000 * 60);
      return ageInMinutes <= 20;
    }));
    setNotification({ message: 'Order accepted! Head to the location.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRejectOrder = (orderId: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: o.status === 'ready' ? 'ready' : 'rider_assign_pickup', // Keep it ready for other riders
          riderPhone: null,
          riderName: null,
          color: 'bg-warning/20 text-warning'
        };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setTasks(updated.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['delivered', 'completed', 'Cancelled'].includes(o.status)));
    setAvailableOrders(updated.filter((o: any) => {
      const isAvailable = (o.status === 'rider_assign_pickup' || o.status === 'ready') && !o.riderPhone;
      if (!isAvailable) return false;
      const now = new Date().getTime();
      const createdAt = new Date(o.createdAt).getTime();
      const ageInMinutes = (now - createdAt) / (1000 * 60);
      return ageInMinutes <= 20;
    }));
    setNotification({ message: 'Order rejected.', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
    setOrderToReject(null);
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
      const riderFee = order.riderFee || 1000;
      
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
            status: 'delivered', 
            color: 'bg-success text-on-success',
            deliveredAt: new Date().toISOString()
          };
        }
        return o;
      });
      localStorage.setItem('qw_orders', JSON.stringify(updatedOrders));
      setTasks(updatedOrders.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['delivered', 'completed', 'Cancelled'].includes(o.status)));

      setNotification({ message: 'Handover verified! Delivery complete.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
    } else {
      setNotification({ message: 'Invalid handover code!', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleVerifyPickup = (order: any) => {
    const input = handoverInput[order.id];
    if (input === order.pickupCode) {
      // First 50% rider fee to rider on pickup
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const riderFee = order.riderFee || 1000;
      
      const updatedUsers = allUsers.map((u: any) => {
        if (u.phoneNumber === currentUser?.phoneNumber) {
          return { ...u, walletBalance: (u.walletBalance || 0) + (riderFee * 0.5) };
        }
        return u;
      });
      localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));

      // Update order status
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const updatedOrders = allOrders.map((o: any) => {
        if (o.id === order.id) {
          return { 
            ...o, 
            status: 'picked_up', 
            color: 'bg-secondary text-on-secondary',
            pickedUpAt: new Date().toISOString()
          };
        }
        return o;
      });
      localStorage.setItem('qw_orders', JSON.stringify(updatedOrders));
      setTasks(updatedOrders.filter((o: any) => o.riderPhone === currentUser?.phoneNumber && !['delivered', 'completed', 'Cancelled'].includes(o.status)));

      setNotification({ message: 'Pickup confirmed! Head to the vendor.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
    } else {
      setNotification({ message: 'Invalid pickup code!', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
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

  const handleStartNavigation = (landmark: string) => {
    // Use Google Maps Directions mode to show route from current location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(landmark + ', Ogbomoso')}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Rider Station" showAudioToggle />
      
      <main className="pt-8 px-6 max-w-7xl mx-auto">
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
                              <h4 className="font-headline font-black text-xl text-on-surface mb-2">{order.customerName}</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary">
                                  <MapPin className="w-3 h-3" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Pickup: {order.customerLandmark}</p>
                                </div>
                                <div className="flex items-center gap-2 text-tertiary">
                                  <Package className="w-3 h-3" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Vendor: {order.vendorName} ({order.vendorLandmark})</p>
                                </div>
                              </div>
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
                      const destinationLandmark = isPickup ? order.customerLandmark : order.vendorLandmark;
                      const destinationName = isPickup ? order.customerName : order.vendorName;
                      const destinationPhone = isPickup ? order.customerPhone : order.vendorPhone;
                      
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
                                  {isPickup ? 'Pickup from' : 'Deliver to'} {destinationName}
                                </h4>
                                <p className="text-xs font-bold text-on-surface-variant">{destinationLandmark} • {destinationPhone}</p>
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
                                  onClick={() => setOrderToReject(order.id)}
                                  className="text-[10px] font-black uppercase tracking-widest text-error hover:underline"
                                >
                                  Reject Task
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleStartNavigation(destinationLandmark)}
                              className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                              <Navigation className="w-5 h-5" /> NAVIGATE
                            </button>
                            
                            {order.status === 'Pending Pickup' && (
                              <div className="flex-1 flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Code"
                                  value={handoverInput[order.id] || ''}
                                  onChange={(e) => setHandoverInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  className="w-24 h-14 bg-surface-container-highest rounded-xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-2 ring-primary"
                                />
                                <button 
                                  onClick={() => handleVerifyPickup(order)}
                                  className="flex-1 h-14 bg-primary text-on-primary rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                                >
                                  PICKUP
                                </button>
                              </div>
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

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={cn(
                "fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 font-headline font-black text-sm",
                notification.type === 'success' ? "bg-success text-on-success" : 
                notification.type === 'error' ? "bg-error text-on-error" : "bg-primary text-on-primary"
              )}
            >
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Confirmation Modal */}
        {orderToReject && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-surface/60 backdrop-blur-md"
              onClick={() => setOrderToReject(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm bg-surface-container-low rounded-[2rem] p-8 border border-error/20 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-headline font-black mb-2">Reject Task?</h3>
              <p className="text-on-surface-variant text-sm mb-8">Are you sure? This order will be returned to the available pool for other riders.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setOrderToReject(null)}
                  className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-bold text-xs"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => handleRejectOrder(orderToReject)}
                  className="flex-1 h-12 bg-error text-white rounded-xl font-bold text-xs shadow-lg shadow-error/20"
                >
                  REJECT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
  );
}
