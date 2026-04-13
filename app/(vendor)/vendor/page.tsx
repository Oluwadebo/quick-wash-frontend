'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Volume2, Package, CheckCircle, Clock, ArrowRight, Play, Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);


  React.useEffect(() => {
    if (!user) return;
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    // Filter orders for this vendor using their phone number as ID
    setOrders(allOrders.filter((o: any) => o.vendorId === user.phoneNumber || o.vendorId === 'campus-cleans'));
  }, [user]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => 
      o.id === orderId ? { ...o, status: newStatus, color: getStatusColor(newStatus) } : o
    );
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setOrders(updated.filter((o: any) => o.vendorId === user?.phoneNumber || o.vendorId === 'campus-cleans'));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus, color: getStatusColor(newStatus) });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Washing': return 'bg-tertiary-container text-on-tertiary-container';
      case 'Awaiting Delivery Confirmation': return 'bg-warning/20 text-warning';
      case 'Ready for Delivery': return 'bg-primary text-on-primary';
      case 'Handover': return 'bg-success text-white';
      default: return 'bg-primary-container text-on-primary-container';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['vendor']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Vendor" showAudioToggle />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                <TrendingUp className="text-primary w-6 h-6" />
              </div>
              <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
              <div className="ml-auto flex items-center gap-2 bg-tertiary-container/20 px-4 py-2 rounded-xl border border-tertiary-container/30">
                <ShieldCheck className="text-tertiary w-4 h-4 fill-current" />
                <span className="text-[10px] font-headline font-black text-tertiary uppercase tracking-widest">Verified Shop</span>
              </div>
            </div>
            <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface mb-6 tracking-tighter">
              Welcome, {user?.shopName || 'Vendor'}!
            </h1>
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl border border-primary/5">
              <Volume2 className="text-primary w-6 h-6 fill-current" />
              <p className="font-headline font-bold text-lg text-on-surface">Good work! New clothes have arrived.</p>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Today&apos;s Earnings</p>
              <h3 className="text-4xl font-headline font-black text-on-surface mb-4">₦{orders.reduce((acc, o) => acc + o.totalPrice, 0).toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from yesterday</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Active Orders</p>
              <h3 className="text-4xl font-headline font-black text-on-surface mb-4">{orders.length.toString().padStart(2, '0')}</h3>
              <div className="flex items-center gap-2 text-on-surface-variant font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>Avg. turnaround: 4.2h</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Trust Points</p>
              <h3 className="text-4xl font-headline font-black text-on-surface mb-4">{user?.trustPoints || 50}</h3>
              <div className="flex items-center gap-2 text-tertiary font-bold text-xs">
                <Star className="w-4 h-4 fill-current" />
                <span>Top Rated Vendor</span>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-headline font-black text-on-surface">Incoming Orders</h2>
              <button className="text-primary font-headline font-bold text-sm flex items-center gap-2">
                View All History <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {orders.map((order, idx) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 border border-primary/5 cursor-pointer hover:border-primary/20 transition-all"
                >
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                    <Package className="text-primary w-10 h-10" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h4 className="text-xl font-headline font-black text-on-surface">{order.customerName}</h4>
                      <span className="font-label text-[10px] font-black bg-surface-container-highest px-3 py-1 rounded-full uppercase tracking-widest">#{order.id}</span>
                    </div>
                    <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">{order.items}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <span className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest", order.color)}>
                      {order.status}
                    </span>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">{order.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {order.status === 'Pending Pickup' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'Washing'); }}
                        className="flex-1 md:flex-none bg-tertiary text-on-tertiary px-6 py-4 rounded-2xl font-headline font-black text-xs shadow-lg active:scale-95 transition-transform"
                      >
                        START WASHING
                      </button>
                    )}
                    {order.status === 'Washing' && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          updateOrderStatus(order.id, 'Awaiting Delivery Confirmation'); 
                          const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
                          const updated = allOrders.map((o: any) => 
                            o.id === order.id ? { ...o, readyForDeliveryAt: new Date().toISOString() } : o
                          );
                          localStorage.setItem('qw_orders', JSON.stringify(updated));
                        }}
                        className="flex-1 md:flex-none signature-gradient text-white px-6 py-4 rounded-2xl font-headline font-black text-xs shadow-lg active:scale-95 transition-transform"
                      >
                        READY FOR PICKUP
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {orders.length === 0 && (
                <div className="py-20 text-center bg-surface-container-low rounded-[2rem] border border-dashed border-primary/20">
                  <p className="text-on-surface-variant font-headline font-bold text-xl">No incoming orders yet.</p>
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-tertiary/20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-tertiary/5 flex items-center justify-center">
                <Volume2 className="text-tertiary w-10 h-10 fill-current" />
              </div>
              <h3 className="text-2xl font-headline font-black">Report Rain</h3>
              <p className="text-on-surface-variant font-medium max-w-xs">Notify all active customers that drying might be delayed due to weather.</p>
              <button 
                onClick={() => {
                  const alerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
                  alerts.push({
                    id: Date.now(),
                    type: 'Weather',
                    msg: `Rain reported by ${user?.shopName || 'a vendor'} in Under G.`,
                    time: 'Just now',
                    icon: 'AlertTriangle',
                    color: 'bg-error-container text-on-error-container'
                  });
                  localStorage.setItem('qw_alerts', JSON.stringify(alerts));
                  alert('Rain reported! Customers and Admin have been notified.');
                }}
                className="bg-tertiary text-on-tertiary px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full"
              >
                REPORT RAIN 🌧️
              </button>
            </div>
            
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
                <TrendingUp className="text-primary w-10 h-10" />
              </div>
              <h3 className="text-2xl font-headline font-black">Wallet & Payouts</h3>
              <p className="text-on-surface-variant font-medium max-w-xs">Check your balance and request a withdrawal to your bank account.</p>
              <button className="signature-gradient text-white px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full">
                OPEN WALLET
              </button>
            </div>
          </section>
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-surface rounded-[3rem] p-10 shadow-2xl overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-1">Order Details</p>
                    <h2 className="text-4xl font-headline font-black text-on-surface tracking-tighter">#{selectedOrder.id}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface active:scale-95 transition-transform"
                  >
                    <CheckCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="bg-surface-container-low p-6 rounded-3xl border border-primary/5">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Customer Information</p>
                    <h4 className="text-2xl font-headline font-black mb-1">{selectedOrder.customerName}</h4>
                    <p className="font-medium text-on-surface-variant">{selectedOrder.customerPhone}</p>
                  </div>

                  <div className="bg-surface-container-low p-6 rounded-3xl border border-primary/5">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Items to Wash</p>
                    <p className="text-xl font-headline font-bold text-on-surface leading-relaxed">{selectedOrder.items}</p>
                  </div>

                  <div className="flex justify-between items-center bg-primary/5 p-6 rounded-3xl border border-primary/10">
                    <div>
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Payout</p>
                      <h3 className="text-3xl font-headline font-black text-primary">₦{selectedOrder.totalPrice.toLocaleString()}</h3>
                    </div>
                    <span className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest", selectedOrder.color)}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4">
                  {selectedOrder.status === 'Pending Pickup' && (
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'Washing')}
                      className="col-span-2 h-20 bg-tertiary text-on-tertiary rounded-2xl font-headline font-black text-xl shadow-xl active:scale-[0.98] transition-all"
                    >
                      START WASHING
                    </button>
                  )}
                  {selectedOrder.status === 'Washing' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'Awaiting Delivery Confirmation');
                        const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
                        const updated = allOrders.map((o: any) => 
                          o.id === selectedOrder.id ? { ...o, readyForDeliveryAt: new Date().toISOString() } : o
                        );
                        localStorage.setItem('qw_orders', JSON.stringify(updated));
                      }}
                      className="col-span-2 h-20 signature-gradient text-white rounded-2xl font-headline font-black text-xl shadow-xl active:scale-[0.98] transition-all"
                    >
                      MARK AS READY
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
