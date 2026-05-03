'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { formatRelativeTime } from '@/lib/time';
import { X, History, Wallet, ShoppingBag, Volume2, TrendingUp, Star, ShieldCheck, Clock, Package, ArrowRight, Play, AlertTriangle, Edit3, Trash2, Plus, Shirt, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, CheckCircle2, CloudRain, Droplets, Camera, Info, BarChart3, WashingMachine, Lock, Zap, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { api, Order, UserData } from '@/lib/ApiService';
import { Toast } from '@/components/shared/Toast';

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorDashboard() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'orders' | 'history' | 'payout' | 'prices' | 'settings' | 'disputes'>('orders');

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'history', 'payout', 'prices', 'settings', 'disputes'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [handoverInput, setHandoverInput] = React.useState<{ [key: string]: string }>({});
  const [isPriceModalOpen, setIsPriceModalOpen] = React.useState(false);
  const [isServicePickerOpen, setIsServicePickerOpen] = React.useState(false);
  const [globalServices, setGlobalServices] = React.useState<string[]>([]);
  const [editingService, setEditingService] = React.useState<any>(null);
  const [services, setServices] = React.useState<any[]>([]);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [timeRange, setTimeRange] = React.useState<'today' | '7d' | '14d' | '30d' | '2m' | 'custom'>('30d');
  const [customRange, setCustomRange] = React.useState({ start: '', end: '' });
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [isClosingShop, setIsClosingShop] = React.useState(false);
  const [returnTimeInput, setReturnTimeInput] = React.useState('');
  const [complaintOrder, setComplaintOrder] = React.useState<Order | null>(null);
  const [complaintMsg, setComplaintMsg] = React.useState('');
  const [walletHistory, setWalletHistory] = React.useState<any[]>([]);

  const [stats, setStats] = React.useState({
    totalEarnings: 0,
    pendingBalance: 0,
    activeOrders: 0,
    trustScore: 100
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({ fullName: '', phoneNumber: '' });
  const [isShopModalOpen, setIsShopModalOpen] = React.useState(false);
  const [shopForm, setShopForm] = React.useState({ shopName: '', whatsappNumber: '', landmark: '' });
  const [isBankModalOpen, setIsBankModalOpen] = React.useState(false);
  const [bankForm, setBankForm] = React.useState({ bankName: '', bankAccountNumber: '', bankAccountName: '' });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const allOrders = await api.getOrders(currentUser.uid, 'vendor');
      
      // Case-insensitive vendor filtering (Secondary safety)
      const vendorOrders = allOrders.filter((o: Order) => 
        o.vendorId && o.vendorId.toLowerCase() === currentUser.uid.toLowerCase()
      );
      
      // Check for 3-day delay penalty
      const now = new Date().getTime();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      let penaltyApplied = false;

      const checkedOrders = await Promise.all(vendorOrders.map(async (o: Order) => {
        if (o.status.toLowerCase() === 'washing' && o.time) {
          const startTime = new Date(o.time).getTime();
          if (now - startTime > threeDays && !o.penaltyApplied) {
            o.penaltyApplied = true;
            penaltyApplied = true;
            
            if (currentUser?.uid) {
              await api.adjustTrustPoints(currentUser.uid, 'vendor_delay');
            }
            await api.saveOrder(o);
          }
        }
        return o;
      }));

      setOrders(checkedOrders);

      const me = await api.getUser(currentUser.uid);
      if (me) {
        setStats({
          totalEarnings: me.walletBalance || 0,
          pendingBalance: me.pendingBalance || 0,
          activeOrders: vendorOrders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status.toLowerCase())).length,
          trustScore: me.trustPoints || 100
        });
      }

      // Real wallet history from API if needed (maybe only on first load or manual refresh)
      // but let's refresh balance at least
    } catch (e) {
      console.error('[Vendor] Polling error:', e);
    }
  }, [currentUser]);

  React.useEffect(() => {
    const initServices = async () => {
      if (!currentUser?.uid) return;
      
      // Load Services using ApiService
      const vendorPrices = await api.getVendorPriceList(currentUser.uid);
      setServices(vendorPrices);
      
      // Fetch global services from database
      try {
        const settings = await api.getSiteSettings();
        const gServices = settings.globalServices && settings.globalServices.length > 0 
          ? settings.globalServices 
          : ["Shirt", "Jeans", "Native", "Suit", "Duvet", "Bedsheet"];
        setGlobalServices(gServices);
      } catch (e) {
        setGlobalServices(["Shirt", "Jeans", "Native", "Suit", "Duvet", "Bedsheet"]);
      }
    };

    fetchData();
    initServices();

    const interval = setInterval(() => {
      fetchData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [currentUser, fetchData]);

  const handleStatusUpdate = async (orderId: string, newStatus: string, color: string, extraData: any = {}) => {
    try {
      // Use updateOrderStatus which is cleaner for status transitions
      await api.updateOrderStatus(orderId, newStatus, color, extraData);
      
      const allOrders = await api.getOrders(currentUser?.uid, 'vendor');
      setOrders(allOrders.filter((o: Order) => o.vendorId?.toLowerCase() === currentUser?.uid?.toLowerCase()));
      setSelectedOrder(null);
      
      setNotification({ message: `Order status updated to ${newStatus}`, type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    } catch (error: any) {
      console.error('Status update failed:', error);
      const errorMsg = error.message && error.message.startsWith('{') ? JSON.parse(error.message).error : error.message;
      setNotification({ message: errorMsg || "Update failed. Please try again.", type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleVerifyHandover = async (order: Order, overrideCode?: string) => {
    const input = overrideCode || handoverInput[order.id];
    if (!input || input.length < 4) {
      setNotification({ message: "Please enter the 4-digit code.", type: 'error' });
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    // Backend API handles the 80% payout on 'washing' status change
    // We send the code to backend for validation. Even if frontend matches, 
    // backend is the source of truth.
    await handleStatusUpdate(order.id, 'washing', 'bg-primary text-on-primary', { handoverCode: input });
    setHandoverInput(prev => ({ ...prev, [order.id]: '' }));
    window.dispatchEvent(new Event('storage'));
  };

  const toggleReadyForDelivery = async (orderId: string, isReady: boolean) => {
    const order = await api.getOrder(orderId);
    if (order) {
      const code3 = isReady ? generateCode() : null;
      const updatedOrder = { 
        ...order, 
        status: isReady ? 'ready' : 'washing', 
        code3,
        color: isReady ? 'bg-success text-on-success' : 'bg-primary text-on-primary',
        readyForDeliveryAt: isReady ? new Date().toISOString() : null
      };
      await api.saveOrder(updatedOrder);
      
      const allOrders = await api.getOrders(currentUser?.uid, 'vendor');
      setOrders(allOrders.filter((o: Order) => o.vendorId?.toLowerCase() === currentUser?.uid?.toLowerCase()));
      setSelectedOrder(null);
      
      setNotification({ message: isReady ? "Order is ready for delivery!" : "Order moved back to washing.", type: 'success' });
      setTimeout(() => setNotification(null), 2000);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let updated;
    const serviceToSave = {
      ...editingService,
      id: editingService.id || Date.now(),
      vendorId: currentUser.uid,
      subItems: editingService.subItems || []
    };
    
    if (editingService.id) {
      updated = services.map((s: any) => s.id === editingService.id ? serviceToSave : s);
    } else {
      updated = [...services, serviceToSave];
    }
    
    await api.saveVendorPriceList(currentUser.uid, updated);
    setServices(updated);

    // We don't update global services in the database as a vendor for security,
    // but we can update the local state for the current session if they added something new.
    if (!globalServices.includes(editingService.name)) {
      setGlobalServices(prev => [...prev, editingService.name]);
    }

    setIsPriceModalOpen(false);
    setEditingService(null);
    setNotification({ message: "Service prices saved!", type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDeleteService = async (id: number) => {
    if (confirm('Delete this entire service from your shop?')) {
      const updated = services.filter((s: any) => s.id !== id);
      if (currentUser?.uid) {
        await api.saveVendorPriceList(currentUser.uid, updated);
        setServices(updated);
        setNotification({ message: "Service removed from your list.", type: 'info' });
        setTimeout(() => setNotification(null), 2000);
      }
    }
  };

  const handleReportRain = async () => {
    try {
      const msg = `Heavy rain reported at ${currentUser?.shopName || 'a vendor shop'}. Deliveries may be delayed.`;
      await api.updateSiteSettings({ emergencyAlert: msg });
      setNotification({ message: "Rain reported! System-wide alert issued.", type: 'warning' as any });
    } catch (e) {
      setNotification({ message: "Failed to report rain.", type: 'error' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVendorEvidenceUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const allOrders = await api.getOrders(currentUser?.uid, 'vendor');
          const order = allOrders.find(o => o.id === orderId);
          if (order) {
            await api.saveOrder({
              ...order,
              vendorEvidenceImage: base64String
            });
            const updatedOrders = await api.getOrders(currentUser?.uid, 'vendor');
            setOrders(updatedOrders.filter((o: Order) => o.vendorId?.toLowerCase() === currentUser?.uid?.toLowerCase()));
            setNotification({ message: 'Evidence uploaded successfully!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
            window.dispatchEvent(new Event('storage'));
          }
        } catch (err) {
          console.error(err);
          setNotification({ message: 'Upload failed.', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWithdrawal = async () => {
    if (stats.totalEarnings < 8000) return;
    
    if (currentUser?.uid) {
      await api.updateUser(currentUser.uid, { withdrawalRequested: true });
      setNotification({ message: "Withdrawal request submitted!", type: 'success' });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Vendor Station" />
      
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                    <TrendingUp className="text-primary w-6 h-6" />
                  </div>
                  <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
                </div>
                <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface mb-2 tracking-tighter">
                  Welcome, {currentUser?.shopName || 'Vendor'}!
                </h1>
                <p className="text-on-surface-variant font-medium">Manage your laundry operations with visual precision.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="bg-surface-container-low rounded-[2rem] px-6 h-24 flex items-center gap-4 border border-primary/10">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Shop Status</p>
                    <p className={cn("font-headline font-black", (currentUser?.isShopClosed ? "text-error" : "text-success"))}>
                      {currentUser?.isShopClosed ? 'CLOSED' : 'OPEN'}
                    </p>
                    {currentUser?.isShopClosed && currentUser?.returnTime && (
                      <p className="text-[8px] font-bold text-on-surface-variant">Back at: {currentUser.returnTime}</p>
                    )}
                  </div>
                  <button 
                    onClick={async () => {
                      if (!currentUser?.isShopClosed) {
                        setIsClosingShop(true);
                      } else {
                        await api.updateUser(currentUser.uid, { isShopClosed: false, returnTime: null });
                        window.dispatchEvent(new Event('storage'));
                      }
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full relative p-1 transition-colors",
                      currentUser?.isShopClosed ? "bg-error/20" : "bg-success/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full shadow-sm transition-all",
                      currentUser?.isShopClosed ? "bg-error ml-0" : "bg-success ml-auto"
                    )} />
                  </button>
                </div>

                <button
                  onClick={async () => {
                    if (currentUser?.uid) {
                      const newRainState = !currentUser.isRaining;
                      await api.updateUser(currentUser.uid, { isRaining: newRainState });
                      
                      setNotification({ 
                        message: newRainState ? "Rain Reported! Shop hidden from customers." : "Rain Cleared! Shop is visible again.", 
                        type: newRainState ? 'info' : 'success' 
                      });
                      
                      const newAlert = {
                        id: Date.now(),
                        type: 'WEATHER',
                        msg: `Heavy rain reported at ${currentUser?.shopName || 'a vendor shop'}.`,
                        time: new Date().toISOString(),
                        vendorId: currentUser.uid
                      };
                      
                      const updatedAlerts = [...(currentUser.alerts || []), newAlert];
                      await api.updateUser(currentUser.uid, { alerts: updatedAlerts });
                      updateUser({ alerts: updatedAlerts });
                      
                      setTimeout(() => setNotification(null), 3000);
                      if (newRainState) window.dispatchEvent(new Event('qw_audio_rain'));
                    }
                  }}
                  className={cn(
                    "h-24 px-8 rounded-[2rem] font-headline font-black text-[10px] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xl min-w-[140px] uppercase tracking-[0.1em]",
                    currentUser?.isRaining 
                      ? "bg-primary text-white ring-8 ring-primary/20" 
                      : "bg-surface-container-highest text-on-surface hover:bg-primary/10 border-4 border-primary/10"
                  )}
                >
                  <CloudRain className={cn("w-8 h-8", currentUser?.isRaining ? "animate-bounce" : "opacity-40")} />
                  {currentUser?.isRaining ? "RAIN REPORTED" : "REPORT RAIN"}
                </button>

                <button
                  onClick={() => {
                    setNotification({ message: "Pickup Broadcast Sent to Nearby Riders!", type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                    window.dispatchEvent(new Event('qw_audio_pickup_broadcast'));
                  }}
                  className="h-24 px-8 bg-tertiary text-on-tertiary rounded-[2rem] font-headline font-black text-[10px] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-tertiary/30 min-w-[140px] uppercase tracking-[0.1em]"
                >
                  <Droplets className="w-8 h-8 rotate-180" />
                  READY FOR PICKUP
                </button>
              </div>
            </div>
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
            {['orders', 'prices', 'history', 'disputes', 'payout', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-8 py-4 rounded-2xl font-headline font-black text-sm capitalize transition-all",
                  activeTab === tab ? "signature-gradient text-white shadow-lg" : "bg-surface-container-low text-on-surface-variant flex items-center gap-2"
                )}
              >
                {tab}
                {tab === 'disputes' && orders.filter(o => o.status === 'disputed').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                )}
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
                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border",
                          service.washDisabled ? "bg-surface-container-highest/50 border-error/10 opacity-60" : "bg-surface-container-lowest border-primary/5"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Wash Only</span>
                          <span className={cn("font-headline font-black", service.washDisabled ? "text-error" : "text-primary")}>
                            {service.washDisabled ? 'DISABLED' : `₦${service.washPrice}`}
                          </span>
                        </div>
                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border",
                          service.ironDisabled ? "bg-surface-container-highest/50 border-error/10 opacity-60" : "bg-surface-container-lowest border-primary/5"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Iron Only</span>
                          <span className={cn("font-headline font-black", service.ironDisabled ? "text-error" : "text-primary")}>
                            {service.ironDisabled ? 'DISABLED' : `₦${service.ironPrice}`}
                          </span>
                        </div>
                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border",
                          service.washIronDisabled ? "bg-surface-container-highest/50 border-error/10 opacity-60" : "bg-primary/5 border-primary/10"
                        )}>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", service.washIronDisabled ? "text-on-surface-variant" : "text-primary")}>Wash + Iron</span>
                          <span className={cn("font-headline font-black", service.washIronDisabled ? "text-error" : "text-primary")}>
                            {service.washIronDisabled ? 'DISABLED' : `₦${service.washIronPrice}`}
                          </span>
                        </div>

                        {/* New Starch Options */}
                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border",
                          service.starchIronDisabled ? "bg-surface-container-highest/50 border-error/10 opacity-60" : "bg-surface-container-lowest border-primary/5"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Starch + Iron Only</span>
                          <span className={cn("font-headline font-black", service.starchIronDisabled ? "text-error" : "text-primary")}>
                            {service.starchIronDisabled ? 'DISABLED' : `₦${service.starchIronPrice || 0}`}
                          </span>
                        </div>
                        <div className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border",
                          service.starchWashIronDisabled ? "bg-surface-container-highest/50 border-error/10 opacity-60" : "bg-surface-container-lowest border-primary/5"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Starch + Wash + Iron</span>
                          <span className={cn("font-headline font-black", service.starchWashIronDisabled ? "text-error" : "text-primary")}>
                            {service.starchWashIronDisabled ? 'DISABLED' : `₦${service.starchWashIronPrice || 0}`}
                          </span>
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
                {orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status.toLowerCase())).map((order) => (
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
                          <p className="text-xs font-bold text-on-surface-variant tracking-widest">{formatRelativeTime(order.time)} • {order.customerName}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                        ['picked_up', 'washing', 'ready', 'picked_up_delivery'].includes(order.status.toLowerCase()) ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : order.color
                      )}>
                        {order.status}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-on-surface-variant mb-8 line-clamp-2 bg-surface-container-lowest p-4 rounded-2xl border border-primary/5 italic">
                      {order.items}
                    </p>

                    <div className="flex gap-4">
                      {order.status.toLowerCase() === 'rider_assign_pickup' && (
                        <button 
                          onClick={() => setComplaintOrder(order)}
                          className="h-14 px-6 bg-error/10 text-error rounded-xl font-headline font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          Make Complaint
                        </button>
                      )}
                      {order.status.toLowerCase() === 'picked_up' && (
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Enter Code 2 from Rider"
                              value={handoverInput[order.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setHandoverInput(prev => ({ ...prev, [order.id]: val }));
                                if (val.length === 4) handleVerifyHandover(order);
                              }}
                              className="flex-1 h-14 bg-surface-container-highest rounded-xl px-6 font-headline font-black tracking-[0.2em] outline-none focus:ring-4 ring-primary/20 text-center"
                              maxLength={4}
                            />
                            <button 
                              onClick={() => handleVerifyHandover(order)}
                              className="w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95"
                            >
                              <ShieldCheck className="w-6 h-6" />
                            </button>
                          </div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center">Auto-verifies on 4th digit</p>
                        </div>
                      )}
                      {order.status.toLowerCase() === 'washing' && (
                        <button 
                          onClick={() => toggleReadyForDelivery(order.id, true)}
                          className="flex-1 h-14 bg-success text-on-success rounded-xl font-headline font-black text-sm shadow-xl shadow-success/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" /> MARK AS READY
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
                    </div>
                    <div className="flex gap-4">
                      {order.status === 'picked_up' && (
                        <button 
                          onClick={() => setComplaintOrder(order)}
                          className="h-14 px-6 bg-error/10 text-error rounded-xl font-headline font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-error/5 hover:bg-error/20"
                        >
                          REPORT ISSUE
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

            {activeTab === 'disputes' && (
              <motion.section 
                key="disputes"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-error/5 p-8 rounded-[2.5rem] border border-error/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-black text-on-surface">Active Disputes</h2>
                      <p className="text-on-surface-variant font-medium text-sm">Action required: Provide proof to avoid automatic refund.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {orders.filter(o => o.status === 'disputed').map(order => (
                      <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-error/20 shadow-sm space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-headline font-black text-xl text-on-surface">Order #{order.id}</h4>
                            <p className="text-xs font-bold text-on-surface-variant">Customer: {order.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-headline font-black text-error">₦{order.totalPrice.toLocaleString()}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Held Amount</p>
                          </div>
                        </div>

                        <div className="bg-surface-container p-4 rounded-xl space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-error">Customer Complaint:</p>
                          <p className="text-sm italic text-on-surface-variant">&quot;{order.issueDescription || 'No description provided.'}&quot;</p>
                        </div>

                        {order.evidenceImage && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Customer Proof:</p>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden grayscale opacity-50">
                              <Image src={order.evidenceImage} alt="Customer Proof" fill className="object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Counter-Evidence:</p>
                          {order.vendorEvidenceImage ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-primary">
                              <Image src={order.vendorEvidenceImage} alt="Vendor Proof" fill className="object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e: any) => handleVendorEvidenceUpload(order.id, e);
                                  input.click();
                                }}
                                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-primary shadow-lg"
                              >
                                Change Photo
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e: any) => handleVendorEvidenceUpload(order.id, e);
                                input.click();
                              }}
                              className="aspect-video rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
                            >
                              <Camera className="w-8 h-8 text-primary/40 mb-2" />
                              <p className="text-xs font-black uppercase tracking-widest text-primary/60">Upload Photo of Laundry</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1 p-4 bg-surface-container-highest rounded-xl text-[10px] font-bold text-on-surface-variant leading-relaxed">
                            Adding a clear photo of the clean items before they were bagged helps the admin resolve disputes in your favor.
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.filter(o => o.status === 'disputed').length === 0 && (
                      <div className="py-20 text-center bg-white rounded-[2rem] border border-primary/5">
                        <CheckCircle2 className="w-12 h-12 text-success/20 mx-auto mb-4" />
                        <p className="text-on-surface-variant font-headline font-bold">No active disputes. Your services are excellent!</p>
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
                  const historical = orders.filter((o: any) => {
                    const status = (o.status || '').toLowerCase();
                    if (!['delivered', 'completed', 'cancelled'].includes(status)) return false;
                    
                    const itemDate = new Date(o.time || o.createdAt);
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
                    return historical.sort((a, b) => new Date(b.time || b.createdAt).getTime() - new Date(a.time || a.createdAt).getTime()).map((order) => (
                      <div key={order.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex justify-between items-center group hover:bg-white transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center">
                            <History className="w-6 h-6 text-on-surface-variant" />
                          </div>
                          <div>
                            <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                            <p className="text-[10px] font-bold text-on-surface-variant">{formatRelativeTime(order.time || order.createdAt)} • ₦{(order.totalPrice || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          ['delivered', 'completed'].includes(order.status.toLowerCase()) ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        )}>
                          {order.status}
                        </span>
                      </div>
                    ));
                  }
                  
                  return (
                    <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[2.5rem]">
                      <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-primary/20" />
                      </div>
                      <p className="text-on-surface-variant font-headline font-bold text-xl">No order history yet.</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Completed orders will appear here</p>
                    </div>
                  );
                })()}
              </motion.section>
            )}

            {activeTab === 'payout' && (
              <motion.section 
                key="payout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Revenue Analytics Widget */}
                <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-2xl font-headline font-black">Revenue Analytics</h3>
                      <p className="text-on-surface-variant text-sm font-medium">Weekly earnings and order volume performance.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-4 py-2 bg-primary/10 rounded-xl text-primary font-bold text-[10px] uppercase tracking-widest">7 Days</div>
                      <div className="px-4 py-2 bg-surface-container-highest rounded-xl text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">30 Days</div>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#1a56db" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-10 p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Order Peak</p>
                      <p className="text-xl font-headline font-black text-primary">Wed</p>
                    </div>
                    <div className="text-center border-x border-primary/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Avg. Order</p>
                      <p className="text-xl font-headline font-black text-on-surface">₦3,850</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Growth</p>
                      <p className="text-xl font-headline font-black text-success">+14.2%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary text-on-primary p-10 rounded-[3rem] shadow-2xl shadow-primary/30">
                  <p className="font-label text-xs uppercase tracking-[0.3em] font-black mb-4 opacity-80">Available for Payout</p>
                  <h2 className="text-6xl font-headline font-black mb-8 tracking-tighter">₦{(currentUser?.walletBalance || 0).toLocaleString()}</h2>
                  <button 
                    onClick={handleWithdrawal}
                    disabled={(currentUser?.walletBalance || 0) < 2000}
                    className="w-full h-16 bg-white text-primary rounded-2xl font-headline font-black text-lg active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {(currentUser?.walletBalance || 0) < 2000 ? 'MIN ₦2,000 REQUIRED' : 'WITHDRAW NOW'}
                  </button>
                </div>
                
                <div>
                  <h3 className="font-headline font-black text-xl mb-6">Recent Transactions</h3>
                  <div className="space-y-4">
                    {walletHistory.length > 0 ? (
                      walletHistory.map((tx) => (
                        <div key={tx._id || tx.id} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex justify-between items-center group hover:bg-white transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              tx.type === 'deposit' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                            )}>
                              {tx.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="font-headline font-black text-on-surface">{tx.desc}</h4>
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{formatRelativeTime(tx.createdAt || tx.time)} • {tx.type}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-lg font-headline font-black",
                            tx.type === 'deposit' ? "text-success" : "text-error"
                          )}>
                            {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[2.5rem]">
                        <p className="text-on-surface-variant font-medium">No transactions yet.</p>
                      </div>
                    )}
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
                <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-headline font-black">Personal Profile</h3>
                    <button 
                      onClick={() => {
                        setProfileForm({
                          fullName: currentUser?.fullName || '',
                          phoneNumber: currentUser?.phoneNumber || ''
                        });
                        setIsProfileModalOpen(true);
                      }}
                      className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> EDIT PROFILE
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white rounded-2xl border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Full Name</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.fullName || 'Not set'}</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-primary/5 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Phone Number</p>
                      <p className="font-headline font-bold text-on-surface">{currentUser?.phoneNumber || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => router.push('/vendor/price-list')}
                    className="flex flex-col items-center justify-center p-10 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] group hover:bg-primary/10 transition-all text-center"
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform shadow-lg">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-headline font-black text-on-surface mb-2">Manage Price List</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Set your prices for laundry items</p>
                  </button>

                  <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-headline font-black">Shop Info</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (currentUser?.isShopClosed) {
                              api.updateUser(currentUser.uid, { isShopClosed: false, returnTime: '' });
                              window.dispatchEvent(new Event('storage'));
                            } else {
                              setIsClosingShop(true);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all",
                            currentUser?.isShopClosed ? "bg-success/10 text-success hover:bg-success/20" : "bg-error/10 text-error hover:bg-error/20"
                          )}
                        >
                          <Lock className="w-3 h-3" /> {currentUser?.isShopClosed ? 'OPEN SHOP' : 'CLOSE SHOP'}
                        </button>
                        <Link 
                          href="/vendor/price-list"
                          className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-headline font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20"
                        >
                          <ShoppingBag className="w-3 h-3" /> Price List
                        </Link>
                        <button 
                          onClick={() => {
                            setShopForm({
                              shopName: currentUser?.shopName || '',
                              whatsappNumber: currentUser?.whatsappNumber || '',
                              landmark: currentUser?.landmark || ''
                            });
                            setIsShopModalOpen(true);
                          }}
                          className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> EDIT SHOP
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {currentUser?.isShopClosed && (
                        <div className="p-4 bg-error/5 rounded-2xl border border-error/10 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-error">Shop is currently Closed • Back at: {currentUser.returnTime}</p>
                        </div>
                      )}
                      <div className="p-4 bg-white rounded-2xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Landmark</p>
                        <p className="font-headline font-bold text-on-surface">{currentUser?.landmark || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">WhatsApp</p>
                        <p className="font-headline font-bold text-on-surface">{currentUser?.whatsappNumber || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-headline font-black">Payout Details</h3>
                    <button 
                      onClick={() => {
                        setBankForm({
                          bankName: currentUser?.bankName || '',
                          bankAccountNumber: currentUser?.bankAccountNumber || '',
                          bankAccountName: currentUser?.bankAccountName || ''
                        });
                        setIsBankModalOpen(true);
                      }}
                      className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> UPDATE BANK
                    </button>
                  </div>
                  <div className="p-6 bg-white rounded-[2rem] border border-primary/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{currentUser?.bankName || 'NOT SET'}</p>
                        <p className="text-xl font-headline font-black text-on-surface">{currentUser?.bankAccountNumber || '#### #### ##'}</p>
                        <p className="text-xs font-medium text-on-surface-variant">{currentUser?.bankAccountName || 'Account Holder Name'}</p>
                      </div>
                      <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-on-surface-variant" />
                      </div>
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
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Items & Pricing</p>
                    <div className="space-y-3">
                      {selectedOrder.items.split(',').map((item: string, i: number) => {
                        const parts = item.trim().split(' - ');
                        const itemName = parts[0];
                        const itemPrice = parts[1];
                        return (
                          <div key={i} className="flex justify-between items-start gap-4 pb-2 border-b border-primary/5 last:border-0">
                            <p className="font-medium text-on-surface leading-tight text-sm">{itemName}</p>
                            {itemPrice && (
                              <p className="font-headline font-black text-primary text-sm shrink-0">{itemPrice}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Customer</p>
                      <p className="font-headline font-black text-on-surface">{selectedOrder.customerName}</p>
                      <p className="text-xs font-bold text-on-surface-variant">{selectedOrder.customerPhone || 'N/A'}</p>
                    </div>
                    <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Net Earnings</p>
                      <p className="font-headline font-black text-2xl text-primary">₦{(selectedOrder.itemsPrice * 0.9 || 0).toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-on-surface-variant italic">10% platform fee deducted</p>
                    </div>
                  </div>

                  {/* Customer Rating Display */}
                  {(selectedOrder.rating || selectedOrder.status === 'completed') && (
                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary">Customer Rating</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Shield 
                              key={star} 
                              className={cn(
                                "w-4 h-4",
                                (selectedOrder.rating || 0) >= star ? "text-primary fill-current" : "text-primary/20"
                              )} 
                            />
                          ))}
                        </div>
                      </div>
                      {selectedOrder.reviewText && (
                        <p className="text-xs font-medium text-on-surface italic">&quot;{selectedOrder.reviewText}&quot;</p>
                      )}
                      {!selectedOrder.rating && (
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">No rating given yet</p>
                      )}
                    </div>
                  )}

                  {/* Handover Code Hidden as per request */}
                  {selectedOrder.status === 'ready' && (
                    <div className="p-6 bg-tertiary-container/10 rounded-3xl border border-tertiary-container/30">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-tertiary fill-current" />
                        <p className="font-headline font-black text-tertiary">Pickup Verification</p>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface-variant mt-2">Ready for rider to pick up. Provide verification code when they arrive.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Closing Shop Modal */}
        <AnimatePresence>
          {isClosingShop && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsClosingShop(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-surface-container-low rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-4">Close Shop</h3>
                <p className="text-on-surface-variant font-medium mb-8">Set a time when you will be back. Customers will see this before selecting you.</p>
                
                <div className="space-y-6">
                  <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Back at (e.g. 2:00 PM, Tomorrow)</p>
                    <input 
                      type="text"
                      placeholder="e.g. 5:00 PM"
                      value={returnTimeInput}
                      onChange={(e) => setReturnTimeInput(e.target.value)}
                      className="w-full bg-transparent font-headline font-black text-2xl text-on-surface outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsClosingShop(false)}
                      className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={async () => {
                        if (!returnTimeInput) {
                          alert("Please set a return time.");
                          return;
                        }
                        await api.updateUser(currentUser.uid, { isShopClosed: true, returnTime: returnTimeInput });
                        setIsClosingShop(false);
                        setReturnTimeInput('');
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="flex-1 h-14 bg-error text-white rounded-2xl font-headline font-black text-sm shadow-lg shadow-error/20"
                    >
                      CLOSE SHOP
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Complaint Modal */}
        <AnimatePresence>
          {complaintOrder && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setComplaintOrder(null)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-surface-container-low rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-4">Report Issue</h3>
                <p className="text-on-surface-variant font-medium mb-8">Something wrong with the order items or customer before you start washing? Report it here.</p>
                
                <div className="space-y-6">
                  <div className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary mb-2">Detailed Complaint</p>
                    <textarea 
                      placeholder="e.g. Missing items, damaged clothes, etc."
                      value={complaintMsg}
                      onChange={(e) => setComplaintMsg(e.target.value)}
                      className="w-full bg-transparent font-medium text-sm text-on-surface outline-none min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setComplaintOrder(null)}
                      className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={async () => {
                        if (!complaintMsg) return;
                        const order = await api.getOrder(complaintOrder.id);
                        if (order) {
                          const updatedOrder = {
                            ...order,
                            status: 'complaint_raised',
                            complaintMsg: complaintMsg,
                            complaintBy: 'vendor',
                            complaintAt: new Date().toISOString()
                          };
                          await api.saveOrder(updatedOrder);
                          setComplaintOrder(null);
                          setComplaintMsg('');
                          setNotification({ message: 'Complaint filed. Admin will review.', type: 'info' });
                          setTimeout(() => setNotification(null), 3000);
                        }
                      }}
                      className="flex-1 h-14 bg-error text-white rounded-2xl font-headline font-black text-sm shadow-lg shadow-error/20"
                    >
                      FILE COMPLAINT
                    </button>
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
                        setEditingService({ 
                          name: s, 
                          washPrice: 0, 
                          ironPrice: 0, 
                          washIronPrice: 0, 
                          whitePremium: 0,
                          starchIronPrice: 0,
                          starchWashIronPrice: 0
                        });
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
                    setEditingService({ 
                      name: '', 
                      washPrice: 0, 
                      ironPrice: 0, 
                      washIronPrice: 0, 
                      whitePremium: 0,
                      starchIronPrice: 0,
                      starchWashIronPrice: 0
                    });
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
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Wash Only (₦)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            disabled={editingService.washDisabled}
                            value={editingService.washDisabled ? '' : (editingService.washPrice || 0)}
                            onChange={(e) => setEditingService({ ...editingService, washPrice: parseInt(e.target.value) || 0 })}
                            className={cn(
                              "w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary",
                              editingService.washDisabled && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                            )}
                            placeholder={editingService.washDisabled ? "OFF" : "Price"}
                          />
                          <button 
                            type="button"
                            onClick={() => setEditingService({ ...editingService, washDisabled: !editingService.washDisabled })}
                            className={cn(
                              "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                              editingService.washDisabled ? "text-error hover:bg-error/10" : "text-primary hover:bg-primary/10"
                            )}
                          >
                            {editingService.washDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Iron Only (₦)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            disabled={editingService.ironDisabled}
                            value={editingService.ironDisabled ? '' : (editingService.ironPrice || 0)}
                            onChange={(e) => setEditingService({ ...editingService, ironPrice: parseInt(e.target.value) || 0 })}
                            className={cn(
                              "w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary",
                              editingService.ironDisabled && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                            )}
                            placeholder={editingService.ironDisabled ? "OFF" : "Price"}
                          />
                          <button 
                            type="button"
                            onClick={() => setEditingService({ ...editingService, ironDisabled: !editingService.ironDisabled })}
                            className={cn(
                              "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                              editingService.ironDisabled ? "text-error hover:bg-error/10" : "text-primary hover:bg-primary/10"
                            )}
                          >
                            {editingService.ironDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Wash + Iron (₦)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            disabled={editingService.washIronDisabled}
                            value={editingService.washIronDisabled ? '' : (editingService.washIronPrice || 0)}
                            onChange={(e) => setEditingService({ ...editingService, washIronPrice: parseInt(e.target.value) || 0 })}
                            className={cn(
                              "w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary",
                              editingService.washIronDisabled && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                            )}
                            placeholder={editingService.washIronDisabled ? "OFF" : "Price"}
                          />
                          <button 
                            type="button"
                            onClick={() => setEditingService({ ...editingService, washIronDisabled: !editingService.washIronDisabled })}
                            className={cn(
                              "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                              editingService.washIronDisabled ? "text-error hover:bg-error/10" : "text-primary hover:bg-primary/10"
                            )}
                          >
                            {editingService.washIronDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Starch + Iron Only (₦)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          disabled={editingService.starchIronDisabled}
                          value={editingService.starchIronDisabled ? '' : (editingService.starchIronPrice || 0)}
                          onChange={(e) => setEditingService({ ...editingService, starchIronPrice: parseInt(e.target.value) || 0 })}
                          className={cn(
                            "w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary",
                            editingService.starchIronDisabled && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                          )}
                          placeholder={editingService.starchIronDisabled ? "OFF" : "Price"}
                        />
                        <button 
                          type="button"
                          onClick={() => setEditingService({ ...editingService, starchIronDisabled: !editingService.starchIronDisabled })}
                          className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                            editingService.starchIronDisabled ? "text-error hover:bg-error/10" : "text-primary hover:bg-primary/10"
                          )}
                        >
                          {editingService.starchIronDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Starch + Wash + Ir (₦)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            disabled={editingService.starchWashIronDisabled}
                            value={editingService.starchWashIronDisabled ? '' : (editingService.starchWashIronPrice || 0)}
                            onChange={(e) => setEditingService({ ...editingService, starchWashIronPrice: parseInt(e.target.value) || 0 })}
                            className={cn(
                              "w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary",
                              editingService.starchWashIronDisabled && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                            )}
                            placeholder={editingService.starchWashIronDisabled ? "OFF" : "Price"}
                          />
                        <button 
                          type="button"
                          onClick={() => setEditingService({ ...editingService, starchWashIronDisabled: !editingService.starchWashIronDisabled })}
                          className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                            editingService.starchWashIronDisabled ? "text-error hover:bg-error/10" : "text-primary hover:bg-primary/10"
                          )}
                        >
                          {editingService.starchWashIronDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
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
        {/* Shop Info Modal */}
        <AnimatePresence>
          {isShopModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsShopModalOpen(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-6">Edit Shop Info</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Shop Name</label>
                    <input 
                      type="text"
                      value={shopForm.shopName}
                      onChange={(e) => setShopForm({...shopForm, shopName: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">WhatsApp Number</label>
                    <input 
                      type="text"
                      value={shopForm.whatsappNumber}
                      onChange={(e) => setShopForm({...shopForm, whatsappNumber: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Landmark (e.g. Under-G)</label>
                    <input 
                      type="text"
                      value={shopForm.landmark}
                      onChange={(e) => setShopForm({...shopForm, landmark: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsShopModalOpen(false)} className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm">CANCEL</button>
                    <button 
                      onClick={async () => {
                        setIsProcessing(true);
                        if (currentUser?.uid) {
                          await api.updateUser(currentUser.uid, shopForm);
                          setNotification({ message: "Shop info updated!", type: 'success' });
                          setIsShopModalOpen(false);
                          window.dispatchEvent(new Event('storage'));
                          setTimeout(() => setNotification(null), 3000);
                        }
                        setIsProcessing(false);
                      }}
                      className="flex-1 h-14 bg-primary text-white rounded-2xl font-headline font-black text-sm shadow-lg shadow-primary/20"
                    >SAVE</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Bank Info Modal */}
        <AnimatePresence>
          {isBankModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsBankModalOpen(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-6">Bank Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Bank Name</label>
                    <input 
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Account Number</label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={bankForm.bankAccountNumber}
                      onChange={(e) => setBankForm({...bankForm, bankAccountNumber: e.target.value.replace(/\D/g, '')})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Account Name</label>
                    <input 
                      type="text"
                      value={bankForm.bankAccountName}
                      onChange={(e) => setBankForm({...bankForm, bankAccountName: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsBankModalOpen(false)} className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm">CANCEL</button>
                    <button 
                      onClick={async () => {
                        if (bankForm.bankAccountNumber.length !== 10) { alert("Account number must be 10 digits"); return; }
                        setIsProcessing(true);
                        if (currentUser?.uid) {
                          await api.updateUser(currentUser.uid, bankForm);
                          setNotification({ message: "Bank details updated!", type: 'success' });
                          setIsBankModalOpen(false);
                          window.dispatchEvent(new Event('storage'));
                          setTimeout(() => setNotification(null), 3000);
                        }
                        setIsProcessing(false);
                      }}
                      className="flex-1 h-14 bg-primary text-white rounded-2xl font-headline font-black text-sm shadow-lg shadow-primary/20"
                    >SAVE</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Profile Info Modal */}
        <AnimatePresence>
          {isProfileModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-primary/10"
              >
                <h3 className="text-3xl font-headline font-black text-on-surface mb-6">Personal Profile</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Full Name</label>
                    <input 
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                      className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Phone Number</label>
                    <input 
                      type="text"
                      disabled
                      value={profileForm.phoneNumber}
                      className="w-full h-14 bg-surface-container-highest rounded-2xl px-6 font-headline font-bold outline-none opacity-50 cursor-not-allowed border border-primary/5"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsProfileModalOpen(false)} className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm">CANCEL</button>
                    <button 
                      onClick={async () => {
                        setIsProcessing(true);
                        if (currentUser?.uid) {
                          await api.updateUser(currentUser.uid, { fullName: profileForm.fullName });
                          setNotification({ message: "Profile updated!", type: 'success' });
                          setIsProfileModalOpen(false);
                          window.dispatchEvent(new Event('storage'));
                          setTimeout(() => setNotification(null), 3000);
                        }
                        setIsProcessing(false);
                      }}
                      className="flex-1 h-14 bg-primary text-white rounded-2xl font-headline font-black text-sm shadow-lg shadow-primary/20"
                    >SAVE</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
}
