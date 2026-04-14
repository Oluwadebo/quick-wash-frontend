'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { formatRelativeTime } from '@/lib/time';
import { X, History, Wallet, ShoppingBag, Volume2, TrendingUp, Star, ShieldCheck, Clock, Package, ArrowRight, Play, AlertTriangle, Edit3, Trash2 } from 'lucide-react';

export default function VendorDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'orders' | 'history' | 'payout' | 'prices'>('orders');
  const [orders, setOrders] = React.useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [handoverInput, setHandoverInput] = React.useState('');
  const [isPriceModalOpen, setIsPriceModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<any>(null);
  const [services, setServices] = React.useState<any[]>([]);

  const [stats, setStats] = React.useState({
    totalEarnings: 0,
    pendingBalance: 0,
    activeOrders: 0,
    trustScore: 100
  });

  React.useEffect(() => {
    if (currentUser) {
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const vendorOrders = allOrders.filter((o: any) => o.vendorId === currentUser.phoneNumber);
      
      // Check for 4-day delay penalty
      const now = new Date().getTime();
      const fourDays = 4 * 24 * 60 * 60 * 1000;
      let penaltyApplied = false;

      const checkedOrders = vendorOrders.map((o: any) => {
        if (o.status === 'Wash' && o.time) {
          const startTime = new Date(o.time).getTime();
          if (now - startTime > fourDays && !o.penaltyApplied) {
            o.penaltyApplied = true;
            penaltyApplied = true;
            
            // Deduct trust points
            const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
            const updatedUsers = allUsers.map((u: any) => {
              if (u.phoneNumber === currentUser.phoneNumber) {
                return { ...u, trustScore: Math.max(0, (u.trustScore || 100) - 10) };
              }
              return u;
            });
            localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));
          }
        }
        return o;
      });

      if (penaltyApplied) {
        const updatedAllOrders = allOrders.map((o: any) => {
          const match = checkedOrders.find(co => co.id === o.id);
          return match || o;
        });
        localStorage.setItem('qw_orders', JSON.stringify(updatedAllOrders));
        setOrders(checkedOrders);
      } else {
        setOrders(vendorOrders);
      }

      // Load services
      const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
      setServices(allServices.filter((s: any) => s.vendorId === currentUser.phoneNumber));

      // Process 24h Payout Release
      const twentyFourHours = 24 * 60 * 60 * 1000;
      let payoutHappened = false;
      
      const updatedOrders = allOrders.map((o: any) => {
        if (o.vendorId === currentUser.phoneNumber && 
            o.status === 'Delivered' && 
            o.deliveredAt && 
            !o.payoutReleased && 
            !o.disputed) {
          const deliveredTime = new Date(o.deliveredAt).getTime();
          if (now - deliveredTime >= twentyFourHours) {
            o.payoutReleased = true;
            payoutHappened = true;
            
            // Move 20% from pending to wallet
            const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
            const updatedUsers = allUsers.map((u: any) => {
              if (u.phoneNumber === currentUser.phoneNumber) {
                const releaseAmount = o.totalPrice * 0.2;
                return { 
                  ...u, 
                  walletBalance: (u.walletBalance || 0) + releaseAmount,
                  pendingBalance: Math.max(0, (u.pendingBalance || 0) - releaseAmount)
                };
              }
              return u;
            });
            localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));
          }
        }
        return o;
      });

      if (payoutHappened) {
        localStorage.setItem('qw_orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders.filter((o: any) => o.vendorId === currentUser.phoneNumber));
      }

      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const me = allUsers.find((u: any) => u.phoneNumber === currentUser.phoneNumber);
      
      setStats({
        totalEarnings: me?.walletBalance || 0,
        pendingBalance: me?.pendingBalance || 0,
        activeOrders: vendorOrders.filter((o: any) => !['Delivered', 'Cancelled'].includes(o.status)).length,
        trustScore: me?.trustScore || 100
      });
    }
  }, [currentUser]);

  const handleStatusUpdate = (orderId: string, newStatus: string, color: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus, color };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setOrders(updated.filter((o: any) => o.vendorId === currentUser?.phoneNumber));
    setSelectedOrder(null);
  };

  const handleVerifyHandover = (order: any) => {
    if (handoverInput === order.handoverCode) {
      // 80% to vendor wallet, 20% to pending, 50% rider fee to rider
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const riderFee = 1000; // Fixed + Dynamic (simulated)
      
      const updatedUsers = allUsers.map((u: any) => {
        if (u.phoneNumber === currentUser?.phoneNumber) {
          const vendorShare = order.totalPrice * 0.8;
          const vendorPending = order.totalPrice * 0.2;
          return { 
            ...u, 
            walletBalance: (u.walletBalance || 0) + vendorShare,
            pendingBalance: (u.pendingBalance || 0) + vendorPending
          };
        }
        if (u.phoneNumber === order.riderPhone) {
          return { ...u, walletBalance: (u.walletBalance || 0) + (riderFee * 0.5) };
        }
        return u;
      });
      localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));

      handleStatusUpdate(order.id, 'Wash', 'bg-primary text-on-primary');
      alert('Handover verified! Order is now in WASHING stage. 80% payment credited, 20% pending.');
      setHandoverInput('');
    } else {
      alert('Invalid handover code!');
    }
  };

  const toggleReadyForDelivery = (orderId: string, isReady: boolean) => {
    handleStatusUpdate(orderId, isReady ? 'Ready for Delivery' : 'Wash', isReady ? 'bg-success text-on-success' : 'bg-primary text-on-primary');
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
    let updated;
    if (editingService.id) {
      updated = allServices.map((s: any) => s.id === editingService.id ? editingService : s);
    } else {
      updated = [...allServices, { ...editingService, id: Date.now(), vendorId: currentUser?.phoneNumber }];
    }
    localStorage.setItem('qw_vendor_services', JSON.stringify(updated));
    setServices(updated.filter((s: any) => s.vendorId === currentUser?.phoneNumber));
    setIsPriceModalOpen(false);
    setEditingService(null);
    alert('Service saved successfully!');
  };

  const handleDeleteService = (id: number) => {
    if (confirm('Delete this service?')) {
      const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
      const updated = allServices.filter((s: any) => s.id !== id);
      localStorage.setItem('qw_vendor_services', JSON.stringify(updated));
      setServices(updated.filter((s: any) => s.vendorId === currentUser?.phoneNumber));
    }
  };

  const handleReportRain = () => {
    const alerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    const newAlert = {
      id: Date.now(),
      type: 'WEATHER ALERT',
      msg: `Heavy rain reported at ${currentUser?.shopName || 'a vendor shop'}. Deliveries may be delayed.`,
      color: 'bg-warning text-on-warning',
      vendorId: currentUser?.phoneNumber,
      time: new Date().toISOString()
    };
    alerts.push(newAlert);
    localStorage.setItem('qw_alerts', JSON.stringify(alerts));
    alert('Rain reported! Customers and riders have been notified.');
  };

  const handleWithdrawal = () => {
    if (stats.totalEarnings < 8000) return;
    
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

  return (
    <ProtectedRoute allowedRoles={['vendor']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Vendor Station" showAudioToggle />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                <TrendingUp className="text-primary w-6 h-6" />
              </div>
              <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
            </div>
            <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface mb-6 tracking-tighter">
              Welcome, {currentUser?.shopName || 'Vendor'}!
            </h1>
            <button 
              onClick={handleReportRain}
              className="flex items-center gap-3 px-6 py-3 bg-warning/10 text-warning rounded-2xl font-headline font-black text-xs hover:bg-warning/20 transition-all active:scale-95"
            >
              <AlertTriangle className="w-5 h-5" /> REPORT RAIN
            </button>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Total Earnings</p>
              <h3 className="text-2xl font-headline font-black text-primary">₦{stats.totalEarnings.toLocaleString()}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Pending</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">₦{stats.pendingBalance.toLocaleString()}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Active Orders</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">{stats.activeOrders}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Trust Score</p>
              <h3 className={cn(
                "text-2xl font-headline font-black",
                stats.trustScore >= 80 ? "text-success" : stats.trustScore >= 60 ? "text-warning" : "text-error"
              )}>{stats.trustScore}%</h3>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
            {['orders', 'prices', 'history', 'payout'].map((tab) => (
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
            {activeTab === 'prices' && (
              <motion.section 
                key="prices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-headline font-black text-on-surface">My Price List</h2>
                  <button 
                    onClick={() => {
                      setEditingService({ name: '', washPrice: 0, ironPrice: 0, washIronPrice: 0, whitePremium: 0 });
                      setIsPriceModalOpen(true);
                    }}
                    className="signature-gradient text-white px-6 py-3 rounded-xl font-headline font-bold text-xs shadow-lg active:scale-95 transition-transform"
                  >
                    Add Service
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((s) => (
                    <div key={s.id} className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-headline font-black text-xl text-on-surface">{s.name}</h4>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingService(s); setIsPriceModalOpen(true); }} className="p-2 bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-primary">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteService(s.id)} className="p-2 bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-error">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Wash Only</span>
                          <span className="text-primary font-bold">₦{s.washPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Iron Only</span>
                          <span className="text-primary font-bold">₦{s.ironPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Wash + Iron</span>
                          <span className="text-primary font-bold">₦{s.washIronPrice}</span>
                        </div>
                        {s.whitePremium > 0 && (
                          <div className="flex justify-between text-tertiary">
                            <span>White Premium</span>
                            <span className="font-bold">+₦{s.whitePremium}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/10 rounded-[3rem]">
                      <p className="text-on-surface-variant font-medium">No services added yet. Add your first service!</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
            {activeTab === 'orders' && (
              <motion.section 
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).map((order) => (
                  <div 
                    key={order.id}
                    className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-headline font-black text-xl text-on-surface">Order #{order.id}</h4>
                          <p className="text-xs font-bold text-on-surface-variant">{formatRelativeTime(order.time)} • {order.customerName}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                        order.color
                      )}>
                        {order.status}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-on-surface-variant mb-8 line-clamp-2 bg-surface-container-lowest p-4 rounded-2xl border border-primary/5">
                      {order.items}
                    </p>

                    <div className="flex gap-4">
                      {order.status === 'Picked Up' && (
                        <div className="flex-1 flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Enter Handover Code"
                            value={handoverInput}
                            onChange={(e) => setHandoverInput(e.target.value)}
                            className="flex-1 h-14 bg-surface-container-highest rounded-xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                          <button 
                            onClick={() => handleVerifyHandover(order)}
                            className="h-14 px-8 bg-primary text-on-primary rounded-xl font-headline font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                          >
                            START WASHING
                          </button>
                        </div>
                      )}
                      {order.status === 'Wash' && (
                        <button 
                          onClick={() => toggleReadyForDelivery(order.id, true)}
                          className="flex-1 h-14 bg-success text-on-success rounded-xl font-headline font-black text-sm shadow-lg shadow-success/20 active:scale-95 transition-transform"
                        >
                          READY FOR DELIVERY
                        </button>
                      )}
                      {order.status === 'Ready for Delivery' && (
                        <button 
                          onClick={() => toggleReadyForDelivery(order.id, false)}
                          className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                        >
                          NOT READY (BACK TO WASH)
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="h-14 px-8 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                      >
                        DETAILS
                      </button>
                    </div>
                  </div>
                ))}
                {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[3rem]">
                    <p className="text-on-surface-variant font-headline font-bold text-xl">No active orders.</p>
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'history' && (
              <motion.section 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).map((order) => (
                  <div key={order.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center">
                        <History className="w-6 h-6 text-on-surface-variant" />
                      </div>
                      <div>
                        <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                        <p className="text-[10px] font-bold text-on-surface-variant">{formatRelativeTime(order.time)} • ₦{order.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      order.status === 'Delivered' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    )}>
                      {order.status}
                    </span>
                  </div>
                ))}
                {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-on-surface-variant font-medium">No order history yet.</p>
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'payout' && (
              <motion.section 
                key="payout"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-primary text-on-primary p-10 rounded-[3rem] shadow-2xl shadow-primary/30">
                  <p className="font-label text-xs uppercase tracking-[0.3em] font-black mb-4 opacity-80">Available for Payout</p>
                  <h2 className="text-6xl font-headline font-black mb-8 tracking-tighter">₦{stats.totalEarnings.toLocaleString()}</h2>
                  <button 
                    onClick={handleWithdrawal}
                    disabled={stats.totalEarnings < 8000}
                    className="w-full h-16 bg-white text-primary rounded-2xl font-headline font-black text-lg active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {stats.totalEarnings < 8000 ? 'MIN ₦8,000 REQUIRED' : 'WITHDRAW NOW'}
                  </button>
                </div>
                
                <div>
                  <h3 className="font-headline font-black text-xl mb-6">Payout History</h3>
                  <div className="py-10 text-center border-2 border-dashed border-primary/10 rounded-[2.5rem]">
                    <p className="text-on-surface-variant font-medium">No payouts yet.</p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        {/* Order Details Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 shadow-2xl border border-primary/10 overflow-y-auto max-h-[80vh]"
              >
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-headline font-black text-on-surface">Order Details</h3>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Items</p>
                    <p className="font-medium text-on-surface leading-relaxed">{selectedOrder.items}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Customer</p>
                      <p className="font-headline font-black text-on-surface">{selectedOrder.customerName}</p>
                      <p className="text-xs font-bold text-on-surface-variant">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Total Price</p>
                      <p className="font-headline font-black text-2xl text-primary">₦{selectedOrder.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-tertiary-container/10 rounded-3xl border border-tertiary-container/30">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-5 h-5 text-tertiary fill-current" />
                      <p className="font-headline font-black text-tertiary">Handover Code</p>
                    </div>
                    <p className="text-3xl font-headline font-black tracking-[0.5em] text-on-surface">{selectedOrder.handoverCode}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant mt-2">Ask the rider for this code to start washing.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Price Modal */}
        <AnimatePresence>
          {isPriceModalOpen && editingService && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPriceModalOpen(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 shadow-2xl border border-primary/10 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-headline font-black text-on-surface">{editingService.id ? 'Edit Service' : 'Add Service'}</h3>
                  <button onClick={() => setIsPriceModalOpen(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSaveService} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Service Name (e.g. Shirt, Jeans)</label>
                    <input 
                      type="text" 
                      required
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Wash Only (₦)</label>
                      <input 
                        type="number" 
                        required
                        value={editingService.washPrice}
                        onChange={(e) => setEditingService({ ...editingService, washPrice: parseInt(e.target.value) })}
                        className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Iron Only (₦)</label>
                      <input 
                        type="number" 
                        required
                        value={editingService.ironPrice}
                        onChange={(e) => setEditingService({ ...editingService, ironPrice: parseInt(e.target.value) })}
                        className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Wash + Iron (₦)</label>
                      <input 
                        type="number" 
                        required
                        value={editingService.washIronPrice}
                        onChange={(e) => setEditingService({ ...editingService, washIronPrice: parseInt(e.target.value) })}
                        className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">White Premium (+₦)</label>
                      <input 
                        type="number" 
                        value={editingService.whitePremium}
                        onChange={(e) => setEditingService({ ...editingService, whitePremium: parseInt(e.target.value) })}
                        className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsPriceModalOpen(false)}
                      className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-sm active:scale-95 transition-transform"
                    >
                      CANCEL
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-14 signature-gradient text-white rounded-xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                    >
                      SAVE SERVICE
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
