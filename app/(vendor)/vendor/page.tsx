'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { formatRelativeTime } from '@/lib/time';
import { X, History, Wallet, ShoppingBag, Volume2, TrendingUp, Star, ShieldCheck, Clock, Package, ArrowRight, Play, AlertTriangle, Edit3, Trash2, Plus, Shirt } from 'lucide-react';
import { db, Order, UserData } from '@/lib/DatabaseService';
import { Toast } from '@/components/shared/Toast';

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

import { useSearchParams } from 'next/navigation';

export default function VendorDashboard() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<'orders' | 'history' | 'payout' | 'prices' | 'settings'>('orders');

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'history', 'payout', 'prices', 'settings'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [handoverInput, setHandoverInput] = React.useState('');
  const [isPriceModalOpen, setIsPriceModalOpen] = React.useState(false);
  const [isServicePickerOpen, setIsServicePickerOpen] = React.useState(false);
  const [globalServices, setGlobalServices] = React.useState<string[]>([]);
  const [editingService, setEditingService] = React.useState<any>(null);
  const [services, setServices] = React.useState<any[]>([]);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [stats, setStats] = React.useState({
    totalEarnings: 0,
    pendingBalance: 0,
    activeOrders: 0,
    trustScore: 100
  });

  React.useEffect(() => {
    const init = async () => {
      if (currentUser?.uid) {
        const allOrders = await db.getOrders();
        const vendorOrders = allOrders.filter((o: Order) => o.vendorId === currentUser.uid);
        
        // Check for 3-day delay penalty
        const now = new Date().getTime();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        let penaltyApplied = false;

        const checkedOrders = await Promise.all(vendorOrders.map(async (o: Order) => {
          if (o.status === 'washing' && o.time) {
            const startTime = new Date(o.time).getTime();
            if (now - startTime > threeDays && !o.penaltyApplied) {
              o.penaltyApplied = true;
              penaltyApplied = true;
              
              // Deduct trust points
              if (currentUser?.uid) {
                await db.adjustTrustPoints(currentUser.uid, 'vendor_delay');
              }
              await db.saveOrder(o);
            }
          }
          return o;
        }));

        setOrders(checkedOrders);

        // Load services
        const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
        setServices(allServices.filter((s: any) => s.vendorId === currentUser.uid));

        // Load global services
        const gServices = JSON.parse(localStorage.getItem('qw_global_services') || '["Shirt", "Trousers", "Jeans", "Bedding", "Towel", "Suit", "Native Wear", "Gown"]');
        setGlobalServices(gServices);

        // Process 24h Payout Release
        const twentyFourHours = 24 * 60 * 60 * 1000;
        let payoutHappened = false;
        
        const updatedOrders = await Promise.all(allOrders.map(async (o: Order) => {
          if (o.vendorId === currentUser.uid && 
              o.status === 'delivered' && 
              o.deliveredAt && 
              !o.payoutReleased && 
              !o.disputed) {
            const deliveredTime = new Date(o.deliveredAt).getTime();
            if (now - deliveredTime >= twentyFourHours) {
              o.status = 'completed'; // Mark as completed after 24h
              o.payoutReleased = true;
              payoutHappened = true;
              
              // Move 20% from pending to wallet
              const me = await db.getUser(currentUser.uid);
              if (me) {
                const releaseAmount = o.totalPrice * 0.2;
                await db.updateUser(me.uid, { 
                  walletBalance: (me.walletBalance || 0) + releaseAmount,
                  pendingBalance: Math.max(0, (me.pendingBalance || 0) - releaseAmount)
                });
                await db.recordTransaction(me.uid, {
                  type: 'deposit',
                  amount: releaseAmount,
                  desc: `Auto-Release Payout (24h) - Order #${o.id}`
                });
              }
              await db.saveOrder(o);
            }
          }
          return o;
        }));

        if (payoutHappened) {
          setOrders(updatedOrders.filter((o: Order) => o.vendorId === currentUser.uid));
        }

        const me = await db.getUser(currentUser.uid);
        if (me) {
          setStats({
            totalEarnings: me.walletBalance || 0,
            pendingBalance: me.pendingBalance || 0,
            activeOrders: vendorOrders.filter((o: Order) => !['delivered', 'completed', 'Cancelled'].includes(o.status)).length,
            trustScore: me.trustPoints || 0
          });
        }
      }
    };
    init();
  }, [currentUser]);

  const handleStatusUpdate = async (orderId: string, newStatus: string, color: string) => {
    const order = await db.getOrder(orderId);
    if (order) {
      const updatedOrder = { ...order, status: newStatus, color };
      await db.saveOrder(updatedOrder);
      
      const allOrders = await db.getOrders();
      setOrders(allOrders.filter((o: Order) => o.vendorId === currentUser?.uid));
      setSelectedOrder(null);
      
      setNotification({ message: `Order status updated to ${newStatus}`, type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleVerifyHandover = async (order: Order) => {
    if (handoverInput === order.code2) {
      const itemsPrice = order.itemsPrice || 0;
      const vendorShare = itemsPrice * 0.8;
      const vendorPending = itemsPrice * 0.2;
      
      if (currentUser?.uid) {
        const me = await db.getUser(currentUser.uid);
        if (me) {
          await db.updateUser(me.uid, { 
            walletBalance: (me.walletBalance || 0) + vendorShare,
            pendingBalance: (me.pendingBalance || 0) + vendorPending
          });
          await db.recordTransaction(me.uid, {
            type: 'deposit',
            amount: vendorShare,
            desc: `Order Payout (80%) - Order #${order.id}`
          });
        }
      }

      await handleStatusUpdate(order.id, 'washing', 'bg-primary text-on-primary');
      setHandoverInput('');
      window.dispatchEvent(new Event('storage'));
    } else {
      setNotification({ message: "Invalid handover code. Please check with the rider.", type: 'error' });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const toggleReadyForDelivery = async (orderId: string, isReady: boolean) => {
    const order = await db.getOrder(orderId);
    if (order) {
      const code3 = isReady ? generateCode() : null;
      const updatedOrder = { 
        ...order, 
        status: isReady ? 'ready' : 'washing', 
        code3,
        color: isReady ? 'bg-success text-on-success' : 'bg-primary text-on-primary',
        readyForDeliveryAt: isReady ? new Date().toISOString() : null
      };
      await db.saveOrder(updatedOrder);
      
      const allOrders = await db.getOrders();
      setOrders(allOrders.filter((o: Order) => o.vendorId === currentUser?.uid));
      setSelectedOrder(null);
      
      setNotification({ message: isReady ? "Order is ready for delivery!" : "Order moved back to washing.", type: 'success' });
      setTimeout(() => setNotification(null), 2000);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
    let updated;
    const serviceToSave = {
      ...editingService,
      id: editingService.id || Date.now(),
      vendorId: currentUser?.uid,
      subItems: editingService.subItems || []
    };
    
    if (editingService.id) {
      updated = allServices.map((s: any) => s.id === editingService.id ? serviceToSave : s);
    } else {
      updated = [...allServices, serviceToSave];
    }
    localStorage.setItem('qw_vendor_services', JSON.stringify(updated));
    setServices(updated.filter((s: any) => s.vendorId === currentUser?.uid));

    // Update global services
    const gServices = JSON.parse(localStorage.getItem('qw_global_services') || '[]');
    if (!gServices.includes(editingService.name)) {
      const newGServices = [...gServices, editingService.name];
      localStorage.setItem('qw_global_services', JSON.stringify(newGServices));
      setGlobalServices(newGServices);
    }

    setIsPriceModalOpen(false);
    setEditingService(null);
    setNotification({ message: "Service saved successfully!", type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDeleteService = (id: number) => {
    if (confirm('Delete this service?')) {
      const allServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
      const updated = allServices.filter((s: any) => s.id !== id);
      localStorage.setItem('qw_vendor_services', JSON.stringify(updated));
      setServices(updated.filter((s: any) => s.vendorId === currentUser?.uid));
      setNotification({ message: "Service deleted.", type: 'info' });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleReportRain = () => {
    const alerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    const newAlert = {
      id: Date.now(),
      type: 'WEATHER ALERT',
      msg: `Heavy rain reported at ${currentUser?.shopName || 'a vendor shop'}. Deliveries may be delayed.`,
      color: 'bg-warning text-on-warning',
      vendorId: currentUser?.uid,
      time: new Date().toISOString()
    };
    alerts.push(newAlert);
    localStorage.setItem('qw_alerts', JSON.stringify(alerts));
    setNotification({ message: "Rain reported! Customers and riders notified.", type: 'warning' as any });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleWithdrawal = async () => {
    if (stats.totalEarnings < 8000) return;
    
    if (currentUser?.uid) {
      await db.updateUser(currentUser.uid, { withdrawalRequested: true });
      setNotification({ message: "Withdrawal request submitted!", type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Vendor Station" showAudioToggle />
      
      <main className="pt-8 px-6 max-w-7xl mx-auto">
          <AnimatePresence>
            {notification && (
              <Toast 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification(null)} 
              />
            )}
          </AnimatePresence>
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
              <h3 className="text-2xl font-headline font-black text-primary">₦{(stats.totalEarnings || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Pending</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">₦{(stats.pendingBalance || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Active Orders</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">{stats.activeOrders}</h3>
            </div>
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Trust Points</p>
              <h3 className={cn(
                "text-2xl font-headline font-black",
                (currentUser?.trustPoints || 0) >= 90 ? "text-success" : (currentUser?.trustPoints || 0) >= 60 ? "text-warning" : "text-error"
              )}>{currentUser?.trustPoints || 0}</h3>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
            {['orders', 'prices', 'history', 'payout', 'settings'].map((tab) => (
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Service Price List</h2>
                    <p className="text-on-surface-variant font-medium">Manage your service offerings and pricing.</p>
                  </div>
                  <button 
                    onClick={() => setIsServicePickerOpen(true)}
                    className="signature-gradient text-white px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> ADD NEW SERVICE
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5 shadow-sm hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl text-primary group-hover:scale-110 transition-transform">
                          <Shirt className="w-8 h-8" />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingService(service);
                              setIsPriceModalOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center hover:text-primary transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center hover:text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-2xl font-headline font-black text-on-surface mb-6">{service.name}</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-surface-container-lowest rounded-2xl border border-primary/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Wash Only</span>
                          <span className="font-headline font-black text-primary">₦{service.washPrice}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-surface-container-lowest rounded-2xl border border-primary/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Iron Only</span>
                          <span className="font-headline font-black text-primary">₦{service.ironPrice}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Wash + Iron</span>
                          <span className="font-headline font-black text-primary">₦{service.washIronPrice}</span>
                        </div>
                        
                        {/* Sub-items display */}
                        {service.subItems && service.subItems.length > 0 && (
                          <div className="pt-4 border-t border-primary/5 space-y-2">
                             <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Sub-Items</p>
                             {service.subItems.map((si: any) => (
                               <div key={si.id} className="flex justify-between items-center text-[10px] font-bold">
                                 <span className="text-on-surface-variant">{si.name}</span>
                                 <span className="text-primary">₦{si.price}</span>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="col-span-full py-20 text-center border-4 border-dashed border-primary/10 rounded-[3rem]">
                      <Package className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                      <p className="text-on-surface-variant font-headline font-bold text-xl">No services added yet.</p>
                      <button 
                        onClick={() => setIsServicePickerOpen(true)}
                        className="mt-6 text-primary font-black uppercase tracking-widest text-xs hover:underline"
                      >
                        Add your first service
                      </button>
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
                {orders.filter(o => !['delivered', 'completed', 'Cancelled'].includes(o.status)).map((order) => (
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
                      {order.status === 'picked_up' && (
                        <div className="flex-1 flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Enter Code 2 from Rider"
                            value={handoverInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHandoverInput(val);
                              if (val === order.code2) handleVerifyHandover(order);
                            }}
                            className="flex-1 h-14 bg-surface-container-highest rounded-xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>
                      )}
                      {order.status === 'washing' && (
                        <button 
                          onClick={() => toggleReadyForDelivery(order.id, true)}
                          className="flex-1 h-14 bg-success text-on-success rounded-xl font-headline font-black text-sm shadow-lg shadow-success/20 active:scale-95 transition-transform"
                        >
                          READY FOR DELIVERY
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="p-4 bg-success/10 rounded-xl border border-success/20 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-success uppercase tracking-widest mb-1">CODE FOR RIDER</p>
                            <p className="text-2xl font-headline font-black text-success tracking-[0.3em]">{order.code3}</p>
                          </div>
                          <button 
                            onClick={() => toggleReadyForDelivery(order.id, false)}
                            className="w-full h-10 bg-surface-container-highest text-on-surface rounded-xl font-headline font-black text-[10px] active:scale-95 transition-transform"
                          >
                            NOT READY (BACK TO WASH)
                          </button>
                        </div>
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
                {orders.filter(o => ['delivered', 'completed', 'Cancelled'].includes(o.status)).map((order) => (
                  <div key={order.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center">
                        <History className="w-6 h-6 text-on-surface-variant" />
                      </div>
                      <div>
                        <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                        <p className="text-[10px] font-bold text-on-surface-variant">{formatRelativeTime(order.time)} • ₦{(order.totalPrice || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      ['delivered', 'completed'].includes(order.status) ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    )}>
                      {order.status}
                    </span>
                  </div>
                ))}
                {orders.filter(o => ['delivered', 'completed', 'Cancelled'].includes(o.status)).length === 0 && (
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
                  <h2 className="text-6xl font-headline font-black mb-8 tracking-tighter">₦{(stats.totalEarnings || 0).toLocaleString()}</h2>
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

            {activeTab === 'settings' && (
              <motion.section 
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-headline font-black">Shop Settings</h3>
                    <button 
                      onClick={async () => {
                        const shopName = prompt("Enter Shop Name:", currentUser?.shopName);
                        const shopAddress = prompt("Enter Shop Address:", currentUser?.shopAddress);
                        const whatsappNumber = prompt("Enter WhatsApp Number:", currentUser?.whatsappNumber);
                        const bankName = prompt("Enter Bank Name:", currentUser?.bankName);
                        const bankAccountNumber = prompt("Enter Bank Account Number (10 digits):", currentUser?.bankAccountNumber);
                        if (bankAccountNumber && (bankAccountNumber.length !== 10 || isNaN(Number(bankAccountNumber)))) {
                          alert("Account number must be exactly 10 digits.");
                          return;
                        }

                        const landmark = prompt("Enter Area Landmark (e.g. Under-G):", currentUser?.landmark);

                        if (currentUser?.uid) {
                          await db.updateUser(currentUser.uid, {
                            shopName: shopName || currentUser.shopName,
                            shopAddress: shopAddress || currentUser.shopAddress,
                            whatsappNumber: whatsappNumber || currentUser.whatsappNumber,
                            bankName: bankName || currentUser.bankName,
                            bankAccountNumber: bankAccountNumber || currentUser.bankAccountNumber,
                            landmark: landmark || currentUser.landmark
                          });
                          setNotification({ message: "Settings updated successfully!", type: 'success' });
                          setTimeout(() => setNotification(null), 2000);
                        }
                      }}
                      className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> EDIT SETTINGS
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Shop Area / Landmark</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.landmark || 'Not set'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Shop Address</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.shopAddress || 'Not set'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">WhatsApp Number</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.whatsappNumber || 'Not set'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Bank Details</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.bankName} - {currentUser?.bankAccountNumber}</p>
                      <p className="text-xs font-medium text-on-surface-variant">{currentUser?.bankAccountName}</p>
                    </div>
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
                      <p className="font-headline font-black text-2xl text-primary">₦{(selectedOrder.totalPrice || 0).toLocaleString()}</p>
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

        {/* Service Picker Modal */}
        <AnimatePresence>
          {isServicePickerOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsServicePickerOpen(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-6">Select Service Type</h3>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {globalServices.map(s => (
                    <button 
                      key={s}
                      onClick={() => {
                        setEditingService({ name: s, washPrice: 0, ironPrice: 0, washIronPrice: 0, whitePremium: 0 });
                        setIsServicePickerOpen(false);
                        setIsPriceModalOpen(true);
                      }}
                      className="h-14 bg-surface-container-lowest rounded-2xl border border-primary/5 font-headline font-bold text-sm hover:border-primary transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setEditingService({ name: '', washPrice: 0, ironPrice: 0, washIronPrice: 0, whitePremium: 0 });
                    setIsServicePickerOpen(false);
                    setIsPriceModalOpen(true);
                  }}
                  className="w-full h-14 bg-primary/10 text-primary rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                >
                  OTHERS (ADD NEW)
                </button>
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
                          value={editingService.washPrice || 0}
                          onChange={(e) => setEditingService({ ...editingService, washPrice: parseInt(e.target.value) || 0 })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Iron Only (₦)</label>
                        <input 
                          type="number" 
                          required
                          value={editingService.ironPrice || 0}
                          onChange={(e) => setEditingService({ ...editingService, ironPrice: parseInt(e.target.value) || 0 })}
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
                          value={editingService.washIronPrice || 0}
                          onChange={(e) => setEditingService({ ...editingService, washIronPrice: parseInt(e.target.value) || 0 })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">White Premium (+₦)</label>
                        <input 
                          type="number" 
                          value={editingService.whitePremium || 0}
                          onChange={(e) => setEditingService({ ...editingService, whitePremium: parseInt(e.target.value) || 0 })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                  </div>

                  {/* Sub-items Section (Multi-Item) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Sub-items (e.g. Duvet, Bedsheet)</label>
                      <button 
                        type="button"
                        onClick={() => {
                          const subItems = [...(editingService.subItems || []), { id: Date.now(), name: '', price: 0 }];
                          setEditingService({ ...editingService, subItems });
                        }}
                        className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> ADD SUB-ITEM
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {(editingService.subItems || []).map((si: any, idx: number) => (
                        <div key={si.id} className="flex gap-3 items-center bg-surface-container-highest/30 p-3 rounded-2xl border border-primary/5">
                          <input 
                            type="text" 
                            placeholder="Item Name"
                            value={si.name}
                            onChange={(e) => {
                              const subItems = [...editingService.subItems];
                              subItems[idx].name = e.target.value;
                              setEditingService({ ...editingService, subItems });
                            }}
                            className="flex-1 h-10 bg-white rounded-xl px-4 text-xs font-bold outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Price"
                            value={si.price}
                            onChange={(e) => {
                              const subItems = [...editingService.subItems];
                              subItems[idx].price = parseInt(e.target.value) || 0;
                              setEditingService({ ...editingService, subItems });
                            }}
                            className="w-24 h-10 bg-white rounded-xl px-4 text-xs font-bold outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const subItems = editingService.subItems.filter((_: any, i: number) => i !== idx);
                              setEditingService({ ...editingService, subItems });
                            }}
                            className="text-error p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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
  );
}
