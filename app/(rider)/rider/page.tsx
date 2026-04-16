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

  React.useEffect(() => {
    const refreshData = async () => {
      if (currentUser?.uid) {
        const allOrders = await db.getOrders();
        
        // Tasks assigned to this rider - STRICT UID FILTERING
        const myTasks = allOrders.filter((o: Order) => o.riderUid === currentUser.uid && !['Delivered', 'Cancelled'].includes(o.status));
        setTasks(myTasks);

        // Orders available for pickup (not yet assigned)
        const available = allOrders.filter((o: Order) => {
          const isAvailable = (o.status === 'rider_assign_pickup' || o.status === 'rider_assign_delivery') && !o.riderUid;
          return isAvailable;
        });
        setAvailableOrders(available);

        const me = await db.getUser(currentUser.uid);
        
        setStats({
          walletBalance: me?.walletBalance || 0,
          trustScore: me?.trustScore || 100,
          completedTasks: allOrders.filter((o: Order) => o.riderUid === currentUser.uid && o.status === 'completed').length
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
      setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser.uid && !['Delivered', 'Cancelled'].includes(o.status)));
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
      setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser.uid && !['Delivered', 'Cancelled'].includes(o.status)));
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
    setTasks(allOrders.filter((o: Order) => o.riderUid === currentUser?.uid && !['Delivered', 'Cancelled'].includes(o.status)));
  };

  const handleVerifyPickup = async (order: Order) => {
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
  };

  const handleVerifyPickupDelivery = async (order: Order) => {
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
  };

  const handleWithdrawal = async () => {
    if (stats.walletBalance < 2000) return;
    
    if (currentUser?.uid) {
      await db.updateUser(currentUser.uid, { withdrawalRequested: true });
      setNotification({ message: "Withdrawal request submitted!", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
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

                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleStartNavigation(destinationLandmark || '')}
                              className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                              <Navigation className="w-5 h-5" /> NAVIGATE
                            </button>
                            
                            {order.status === 'rider_assign_pickup' && (
                              <div className="flex-1 flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Code 1"
                                  value={handoverInput[order.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHandoverInput(prev => ({ ...prev, [order.id]: val }));
                                    if (val === order.code1) handleVerifyPickup(order);
                                  }}
                                  className="w-24 h-14 bg-surface-container-highest rounded-xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-2 ring-primary"
                                />
                                <div className="flex-1 h-14 bg-primary/10 text-primary rounded-xl font-headline font-black text-[10px] flex items-center justify-center text-center px-2">
                                  ENTER CODE FROM CUSTOMER
                                </div>
                              </div>
                            )}

                            {order.status === 'picked_up' && (
                              <div className="flex-1 p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">CODE FOR VENDOR</p>
                                <p className="text-2xl font-headline font-black text-secondary tracking-[0.3em]">{order.code2}</p>
                              </div>
                            )}
                            
                            {order.status === 'rider_assign_delivery' && (
                              <div className="flex-1 flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Code 3"
                                  value={handoverInput[order.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHandoverInput(prev => ({ ...prev, [order.id]: val }));
                                    if (val === order.code3) handleVerifyPickupDelivery(order);
                                  }}
                                  className="w-24 h-14 bg-surface-container-highest rounded-xl px-4 text-center font-headline font-black text-xl outline-none focus:ring-2 ring-primary"
                                />
                                <div className="flex-1 h-14 bg-tertiary/10 text-tertiary rounded-xl font-headline font-black text-[10px] flex items-center justify-center text-center px-2">
                                  ENTER CODE FROM VENDOR
                                </div>
                              </div>
                            )}

                            {order.status === 'picked_up_delivery' && (
                              <div className="flex-1 p-4 bg-tertiary/10 rounded-xl border border-tertiary/20 flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1">CODE FOR CUSTOMER</p>
                                <p className="text-2xl font-headline font-black text-tertiary tracking-[0.3em]">{order.code4}</p>
                              </div>
                            )}
                            {order.status.includes('picked_up') && (
                              <button 
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setIsReturnModalOpen(true);
                                }}
                                className="w-full h-12 bg-error/10 text-error rounded-xl font-headline font-black text-xs active:scale-95 transition-transform"
                              >
                                RETURN ORDER (₦200 PENALTY)
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
                className="space-y-4"
              >
                {/* History items would go here */}
                <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[3rem]">
                  <p className="text-on-surface-variant font-medium">No delivery history yet.</p>
                </div>
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
