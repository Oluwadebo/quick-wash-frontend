'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeTime } from '@/lib/time';
import { db, Order, UserData } from '@/lib/DatabaseService';
import { X, History, Wallet, ShoppingBag, MapPin, Navigation, Package, CheckCircle, Clock, Phone, ArrowRight, Bike, Zap, AlertTriangle, MessageCircle, ShieldAlert } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

export default function RiderDashboard() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'history' | 'wallet' | 'settings'>('tasks');

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['tasks', 'history', 'wallet', 'settings'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  const [tasks, setTasks] = React.useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = React.useState<Order[]>([]);
  const [allMyOrders, setAllMyOrders] = React.useState<Order[]>([]);
  const [stats, setStats] = React.useState({
    walletBalance: 0,
    trustScore: 100,
    completedTasks: 0
  });
  const [handoverInput, setHandoverInput] = React.useState<{ [key: string]: string }>({});
  const [orderToReject, setOrderToReject] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = React.useState(false);
  const [returnReason, setReturnReason] = React.useState('');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<'today' | '7d' | '14d' | '30d' | '2m' | 'custom'>('30d');
  const [customRange, setCustomRange] = React.useState({ start: '', end: '' });

  React.useEffect(() => {
    const refreshData = async () => {
      if (currentUser?.uid) {
        const allOrders = await db.getOrders();
        
        // My entire history sorted by time (latest first)
        const myAll = allOrders
          .filter((o: Order) => o.riderUid === currentUser.uid)
          .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
        setAllMyOrders(myAll);

        // Tasks assigned to this rider - Sorted by claimedAt (latest first)
        const myTasks = myAll
          .filter((o: Order) => !['delivered', 'cancelled', 'completed'].includes((o.status || '').toLowerCase()))
          .sort((a, b) => new Date(b.claimedAt || 0).getTime() - new Date(a.time || 0).getTime());
        setTasks(myTasks);

        // Orders available for pickup (not yet assigned) - Latest first
        const available = allOrders
          .filter((o: Order) => {
            const isAvailable = (o.status === 'rider_assign_pickup' || o.status === 'rider_assign_delivery') && !o.riderUid;
            return isAvailable;
          })
          .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
        setAvailableOrders(available);

        const me = await db.getUser(currentUser.uid);
        
        setStats({
          walletBalance: me?.walletBalance || 0,
          trustScore: me?.trustScore || 100,
          completedTasks: myAll.filter((o: Order) => o.status === 'Completed' || o.status === 'Delivered').length
        });
      }
    };

    refreshData();
    window.addEventListener('storage', refreshData);
    return () => window.removeEventListener('storage', refreshData);
  }, [currentUser]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);
    
    setNotification({ message: 'Claiming order... Please wait.', type: 'info' });

    // ATOMIC TRANSACTION: Claim Order
    const success = await db.claimOrder(
      orderId, 
      currentUser.uid, 
      currentUser.fullName || 'Rider', 
      currentUser.phoneNumber
    );

    if (success) {
      setNotification({ message: 'Order claimed successfully! Redirecting...', type: 'success' });
      // FEEDBACK LOOP: Mandatory 2000ms delay
      setTimeout(() => {
        setNotification(null);
        setIsProcessing(false);
        // State will refresh via storage event or manual refresh
      }, 2000);
    } else {
      setNotification({ message: 'Failed to claim. Order might have been taken by another rider.', type: 'error' });
      setTimeout(() => {
        setNotification(null);
        setIsProcessing(false);
      }, 3000);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!currentUser) return;
    const order = await db.getOrder(orderId);
    if (order && order.riderUid === currentUser.uid) {
      await db.saveOrder({
        ...order,
        riderUid: undefined,
        riderName: undefined,
        riderPhone: undefined,
        status: order.status === 'rider_assign_pickup' ? 'rider_assign_pickup' : 'rider_assign_delivery',
        color: 'bg-warning/20 text-warning'
      });
      setOrderToReject(null);
      setNotification({ message: 'Order rejected and returned to pool.', type: 'info' });
      const allOrders = await db.getOrders();
      setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser.uid && !['delivered', 'cancelled', 'completed'].includes((o.status || '').toLowerCase())));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleReturnOrder = async () => {
    if (!selectedOrderId || !returnReason || !currentUser) return;
    setIsProcessing(true);
    const success = await db.returnOrder(selectedOrderId, currentUser.uid, returnReason);
    if (success) {
      setNotification({ message: 'Order returned. ₦200 deducted from wallet.', type: 'info' });
      setIsReturnModalOpen(false);
      setReturnReason('');
      setSelectedOrderId(null);
      
      // Refresh data
      const allOrders = await db.getOrders();
      setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser.uid && !['delivered', 'cancelled', 'completed'].includes((o.status || '').toLowerCase())));
      const me = await db.getUser(currentUser.uid);
      if (me) {
        setStats(prev => ({
          ...prev,
          walletBalance: me.walletBalance || 0,
          trustScore: me.trustPoints || 100
        }));
      }
    } else {
      setNotification({ message: 'Failed to return order.', type: 'error' });
    }
    setIsProcessing(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, color: string) => {
    await db.updateOrderStatus(orderId, newStatus, color);
    const allOrders = await db.getOrders();
    setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser?.uid && !['delivered', 'cancelled', 'completed'].includes((o.status || '').toLowerCase())));
  };

  const handleVerifyPickup = React.useCallback(async (order: Order) => {
    const input = handoverInput[order.id];
    if (input === order.code1) {
      // First 50% rider fee to rider on pickup
      const riderFee = order.riderFee || 1000;
      const firstHalf = riderFee * 0.5;
      
      if (currentUser?.uid) {
        const me = await db.getUser(currentUser.uid);
        if (me) {
          await db.updateUser(me.uid, { walletBalance: (me.walletBalance || 0) + firstHalf });
          await db.recordTransaction(me.uid, {
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Fee (50%) - Order #${order.id}`
          });
        }
      }

      // Generate Code 2 (Rider sees, Vendor enters)
      const code2 = Math.floor(1000 + Math.random() * 9000).toString();

      // Update order status
      const updatedOrder = { 
        ...order, 
        status: 'picked_up', 
        code2,
        color: 'bg-secondary text-on-secondary',
        pickedUpAt: new Date().toISOString()
      };
      await db.saveOrder(updatedOrder);
      
      setNotification({ message: 'Pickup confirmed! Head to the vendor.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
      window.dispatchEvent(new Event('storage'));
    }
  }, [currentUser, handoverInput]);

  const handleVerifyPickupDelivery = React.useCallback(async (order: Order) => {
    const input = handoverInput[order.id];
    if (input === order.code3) {
      // Generate Code 4 (Rider sees, Customer enters)
      const code4 = Math.floor(1000 + Math.random() * 9000).toString();

      // Update order status
      const updatedOrder = { 
        ...order, 
        status: 'picked_up_delivery', 
        code4,
        color: 'bg-tertiary text-on-tertiary',
        pickedUpDeliveryAt: new Date().toISOString()
      };
      await db.saveOrder(updatedOrder);
      
      setNotification({ message: 'Delivery pickup confirmed! Head to the customer.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
      window.dispatchEvent(new Event('storage'));
    }
  }, [handoverInput]);

  // Handover Code Auto-Check
  React.useEffect(() => {
    const checkCodes = async () => {
      for (const order of tasks) {
        const input = handoverInput[order.id];
        if (input) {
          if (order.status === 'rider_assign_pickup' && input === order.code1) {
            await handleVerifyPickup(order);
          } else if (order.status === 'rider_assign_delivery' && input === order.code3) {
            await handleVerifyPickupDelivery(order);
          }
        }
      }
    };
    checkCodes();
  }, [handoverInput, tasks, handleVerifyPickup, handleVerifyPickupDelivery]);

  const handleWithdrawal = async () => {
    if (stats.walletBalance < 2000) return;
    setIsProcessing(true);
    
    if (currentUser?.uid) {
      await db.updateUser(currentUser.uid, { withdrawalRequested: true });
      await db.recordTransaction(currentUser.uid, {
        type: 'withdrawal',
        amount: stats.walletBalance,
        desc: 'Withdrawal Request'
      });
      setNotification({ message: "Withdrawal request submitted!", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      window.dispatchEvent(new Event('storage'));
    }
    setIsProcessing(false);
  };

  const handleStartNavigation = (landmark: string) => {
    // Use Google Maps Directions mode to show route from current location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(landmark + ', Ogbomoso')}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleReportRain = async () => {
    const alerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    const newAlert = {
      id: Date.now(),
      type: 'WEATHER ALERT',
      msg: `Heavy rain reported by rider ${currentUser?.fullName}. Deliveries may be delayed.`,
      color: 'bg-warning text-on-warning',
      riderUid: currentUser?.uid,
      time: new Date().toISOString()
    };
    alerts.push(newAlert);
    localStorage.setItem('qw_alerts', JSON.stringify(alerts));
    setNotification({ message: 'Rain reported! Customers and vendors have been notified.', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Rider Station" showAudioToggle />
      
      <main className="pt-8 px-6 max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                  <Bike className="text-primary w-6 h-6" />
                </div>
                <div>
                  <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
                  <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">
                    Welcome, {currentUser?.fullName || 'Rider'}!
                  </h1>
                </div>
              </div>
              <button 
                onClick={handleReportRain}
                className="flex items-center gap-3 px-6 py-3 bg-warning/10 text-warning rounded-2xl font-headline font-black text-xs hover:bg-warning/20 transition-all active:scale-95"
              >
                <AlertTriangle className="w-5 h-5" /> REPORT RAIN
              </button>
            </div>
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
                (currentUser?.trustPoints || 0) >= 80 ? "text-success" : (currentUser?.trustPoints || 0) >= 60 ? "text-warning" : "text-error"
              )}>{currentUser?.trustPoints || 0}%</h3>
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
            {['tasks', 'history', 'wallet', 'settings'].map((tab) => (
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
                              <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-1 leading-none">Order #{order.id}</p>
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
                            disabled={currentUser?.status === 'restricted'}
                            className="w-full h-14 signature-gradient text-white rounded-xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                          >
                            {currentUser?.status === 'restricted' ? 'ACCOUNT RESTRICTED' : 'ACCEPT ORDER'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Urgent Alerts for Assigned Rider */}
                {(() => {
                  const urgentDeliveries = tasks.filter(o => o.status === 'ready' || o.status === 'rider_assign_delivery');
                  if (urgentDeliveries.length === 0) return null;
                  
                  return (
                    <div className="mb-12 space-y-4">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                          <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <p className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-primary">Delivery Notifications</p>
                          <h2 className="text-2xl font-headline font-black text-on-surface">Urgent Actions</h2>
                        </div>
                      </div>

                      {urgentDeliveries.map(order => (
                        <motion.div 
                          key={`alert-${order.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-primary/5 border-2 border-primary/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-lg">
                              <Bike className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-headline font-black text-on-surface">
                                {order.status === 'ready' ? 'Ready for Pickup from Vendor' : 'Customer Ready to Receive'}
                              </h3>
                              <p className="font-medium text-on-surface-variant">Order #{order.id} • {order.items}</p>
                            </div>
                          </div>
                          <div className="w-full md:w-auto text-center font-headline font-black text-sm text-primary animate-pulse bg-primary/10 px-4 py-2 rounded-xl">
                            ACTIVE TASK
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}

                {/* My Tasks */}
                <div>
                  <h3 className="font-headline font-black text-xl mb-6">My Active Tasks</h3>
                  <div className="space-y-6">
                    {tasks.map((order) => {
                      const isPickup = order.status === 'rider_assign_pickup';
                      const isDelivery = order.status === 'rider_assign_delivery' || order.status === 'picked_up_delivery';
                      const isPickedUp = order.status === 'picked_up';
                      
                      const destinationLandmark = (isPickup || order.status === 'picked_up') ? order.customerLandmark : order.vendorLandmark;
                      const destinationName = (isPickup || order.status === 'picked_up') ? order.customerName : order.vendorName;
                      const destinationPhone = (isPickup || order.status === 'picked_up') ? order.customerPhone : order.vendorPhone;
                      
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
                                  Order #{order.id}
                                </h4>
                                <h4 className="font-headline font-black text-sm text-primary">
                                  {isPickup ? 'Pickup from' : isDelivery ? 'Deliver to' : 'Heading to'} {destinationName}
                                </h4>
                                <p className="text-xs font-bold text-on-surface-variant">{destinationLandmark} • {destinationPhone}</p>
                                {order.customerAddress && <p className="text-[10px] font-medium text-primary mt-1">Address: {order.customerAddress}</p>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                                order.color
                              )}>
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-primary/5">
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleStartNavigation((isPickup || order.status === 'picked_up') ? order.customerLandmark || '' : order.vendorLandmark || '')}
                                className="flex-1 h-16 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-sm"
                              >
                                <Navigation className="w-5 h-5 text-primary" /> NAVIGATE
                              </button>

                              {order.status === 'rider_assign_pickup' && (
                                <div className="flex-[2] flex gap-3">
                                  <input 
                                    type="text" 
                                    placeholder="Code 1"
                                    value={handoverInput[order.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      setHandoverInput(prev => ({ ...prev, [order.id]: val }));
                                      if (val.length === 4) handleVerifyPickup(order);
                                    }}
                                    className="w-24 h-16 bg-surface-container-highest rounded-2xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-4 ring-primary/20"
                                    maxLength={4}
                                  />
                                  <div className="flex-1 h-16 bg-primary/10 text-primary rounded-2xl font-headline font-black text-[10px] flex items-center justify-center text-center px-4 leading-tight uppercase tracking-wider">
                                    Get Pickup Code From Customer
                                  </div>
                                </div>
                              )}

                              {order.status === 'picked_up' && (
                                <div className="flex-[2] p-4 bg-secondary/10 rounded-2xl border border-secondary/20 flex flex-col items-center justify-center h-16">
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">VENDOR CODE: <span className="text-xl ml-2 font-black">{order.code2}</span></p>
                                </div>
                              )}
                              
                              {order.status === 'rider_assign_delivery' && (
                                <div className="flex-[2] flex gap-3">
                                  <input 
                                    type="text" 
                                    placeholder="Code 3"
                                    value={handoverInput[order.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      setHandoverInput(prev => ({ ...prev, [order.id]: val }));
                                      if (val.length === 4) handleVerifyPickupDelivery(order);
                                    }}
                                    className="w-24 h-16 bg-surface-container-highest rounded-2xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-4 ring-tertiary/20"
                                    maxLength={4}
                                  />
                                  <div className="flex-1 h-16 bg-tertiary/10 text-tertiary rounded-2xl font-headline font-black text-[10px] flex items-center justify-center text-center px-4 leading-tight uppercase tracking-wider">
                                    Get Delivery Code From Vendor
                                  </div>
                                </div>
                              )}

                              {order.status === 'picked_up_delivery' && (
                                <div className="flex-[2] p-4 bg-tertiary/10 rounded-2xl border border-tertiary/20 flex flex-col items-center justify-center h-16">
                                  <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">CUSTOMER CODE: <span className="text-xl ml-2 font-black">{order.code4}</span></p>
                                </div>
                              )}
                            </div>

                            {(order.status === 'rider_assign_pickup' || order.status === 'rider_assign_delivery') && (
                              <button 
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setIsReturnModalOpen(true);
                                }}
                                className="w-full h-14 bg-error/5 text-error hover:bg-error/10 rounded-2xl font-headline font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-2 border border-error/10 uppercase tracking-widest"
                              >
                                <X className="w-5 h-5" /> REJECT / RETURN ORDER (₦200 PENALTY)
                              </button>
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
                className="space-y-6"
              >
                <div className="flex flex-col gap-4">
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

                {(() => {
                  const now = new Date();
                  const historical = allMyOrders.filter((o: any) => {
                    if (!['delivered', 'completed', 'cancelled'].includes(o.status.toLowerCase())) return false;
                    
                    const itemDate = new Date(o.deliveredAt || o.time);
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

                  if (historical.length > 0) {
                    return historical.sort((a: any, b: any) => new Date(b.deliveredAt || b.time).getTime() - new Date(a.deliveredAt || a.time).getTime()).map((order: any) => (
                      <div key={order.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex justify-between items-center group hover:bg-white transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center">
                            <History className="w-6 h-6 text-on-surface-variant" />
                          </div>
                          <div>
                            <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                            <p className="text-[10px] font-bold text-on-surface-variant">{formatRelativeTime(order.deliveredAt || order.time)} • {order.items}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        )}>
                          {order.status}
                        </span>
                      </div>
                    ));
                  }
                  
                  return (
                    <div className="text-center py-20 bg-surface-container-lowest rounded-[3rem] border-2 border-dashed border-primary/10">
                      <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-10 h-10 text-primary/20" />
                      </div>
                      <h4 className="font-headline font-black text-on-surface">No history found</h4>
                      <p className="text-xs font-medium text-on-surface-variant mt-1">Try adjusting your filters to see more tasks.</p>
                    </div>
                  );
                })()}
              </motion.section>
            )}

            {activeTab === 'settings' && (
              <motion.section 
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-headline font-black">Account Settings</h3>
                    <button 
                      onClick={async () => {
                        const fullName = prompt("Enter Full Name:", currentUser?.fullName);
                        const bankName = prompt("Enter Bank Name:", currentUser?.bankName);
                        const bankAccountNumber = prompt("Enter Bank Account Number (10 digits):", currentUser?.bankAccountNumber);
                        if (bankAccountNumber && (bankAccountNumber.length !== 10 || isNaN(Number(bankAccountNumber)))) {
                          alert("Account number must be exactly 10 digits.");
                          return;
                        }

                        const address = prompt("Enter Home Address:", currentUser?.address);

                        if (currentUser?.uid) {
                          await db.updateUser(currentUser.uid, {
                            fullName: fullName || currentUser.fullName,
                            bankName: bankName || currentUser.bankName,
                            bankAccountNumber: bankAccountNumber || currentUser.bankAccountNumber,
                            address: address || currentUser.address
                          });
                          setNotification({ message: "Profile updated!", type: 'success' });
                          setTimeout(() => setNotification(null), 2000);
                        }
                      }}
                      className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> EDIT PROFILE
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Personal Info</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.fullName}</p>
                      <p className="text-xs font-medium text-on-surface-variant">{currentUser?.phoneNumber}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Home Address</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.address || 'Not set'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Bank Details</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.bankName} - {currentUser?.bankAccountNumber}</p>
                    </div>
                  </div>
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
        {/* Return Reason Modal */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-8 sm:hidden" />
              <h3 className="text-3xl font-headline font-black text-on-surface mb-2">Return Order</h3>
              <p className="text-on-surface-variant font-medium mb-8">Please provide a reason for returning this order.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {['Bike Breakdown', 'Heavy Rain', 'Emergency', 'Wrong Location', 'Customer Unreachable'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReturnReason(r)}
                      className={cn(
                        "px-6 py-4 rounded-2xl font-headline font-black text-sm transition-all border text-left flex justify-between items-center",
                        returnReason === r ? "bg-primary/5 border-primary text-primary" : "bg-surface-container border-primary/5 text-on-surface-variant"
                      )}
                    >
                      {r}
                      {returnReason === r && <CheckCircle className="w-5 h-5" />}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleReturnOrder}
                  disabled={isProcessing || !returnReason}
                  className="w-full h-16 bg-error text-white rounded-2xl font-headline font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'PROCESSING...' : 'CONFIRM RETURN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
