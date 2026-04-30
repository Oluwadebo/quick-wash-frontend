'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/shared/TopAppBar';
import ReadyForPickupButton from '@/components/shared/ReadyForPickupButton';
import { Minus, Plus, Sparkles, Shirt, ShoppingBag, Bed, CreditCard, Bolt, Info, ChevronRight, ShieldCheck, Check, MapPin, ShieldAlert, Wallet, History, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { api, Order, UserData } from '@/lib/ApiService';
import { Toast } from '@/components/shared/Toast';

import { formatRelativeTime } from '@/lib/time';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';

const defaultItems = [
  {
    id: 'shirts',
    name: 'Shirts & Tops',
    desc: 'Daily Essentials',
    icon: Shirt,
    basePrice: 200,
    unit: 'unit',
    count: 0,
    services: [
      { name: 'Wash', price: 200 },
      { name: 'Iron', price: 150 },
      { name: 'Wash + Iron', price: 300 }
    ],
    selectedService: 'Wash',
    hasStainRemover: false,
    stainRemoverPrice: 500
  },
  {
    id: 'trousers',
    name: 'Trousers',
    desc: 'Denim & Chinos',
    icon: ShoppingBag,
    basePrice: 250,
    unit: 'unit',
    count: 0,
    services: [
      { name: 'Wash', price: 250 },
      { name: 'Iron', price: 200 },
      { name: 'Wash + Iron', price: 400 }
    ],
    selectedService: 'Wash + Iron',
    hasStainRemover: false,
    stainRemoverPrice: 500
  },
  {
    id: 'beddings',
    name: 'Beddings',
    desc: 'Sheets & Covers',
    icon: Bed,
    basePrice: 0,
    unit: 'item',
    count: 0,
    services: [
      { name: 'Wash', price: 0 },
      { name: 'Steam Press', price: 0 }
    ],
    selectedService: 'Wash',
    hasStainRemover: false,
    stainRemoverPrice: 800,
    subItems: [
      { id: 'bedsheet', name: 'Bedsheet', count: 0, price: 400 },
      { id: 'duvet', name: 'Duvet', count: 0, price: 1200 },
      { id: 'pillowcase', name: 'Pillow Case', count: 0, price: 150 },
      { id: 'completeset', name: 'Complete Set', count: 0, price: 1800 }
    ]
  }
];

const generateId = () => Math.floor(1000 + Math.random() * 9000).toString();

const calculateRiderFee = (landmark?: string) => {
  const distances: { [key: string]: number } = {
    'Under-G': 2,
    'Adenike': 3,
    'Isale-General': 5,
    'Stadium': 4,
    'Bovina': 6,
    'LAUTECH Gate': 1
  };
  const dist = (landmark && distances[landmark]) || 3;
  return 500 + (dist * 100);
};

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-headline font-black">Loading...</div>}>
      <OrderPageContent />
    </Suspense>
  );
}

function OrderPageContent() {
  const { user: authUser, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor');
  const [cart, setCart] = React.useState<any[]>(defaultItems);
  const [isPaid, setIsPaid] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [vendor, setVendor] = React.useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = React.useState<UserData | null>(null);
  const [existingOrderId, setExistingOrderId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [pickupLandmark, setPickupLandmark] = React.useState('');
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'wallet' | 'transfer' | 'card'>('wallet');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [siteSettings, setSiteSettings] = React.useState<any>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initPage = async () => {
      if (!vendorId) return;
      api.getSiteSettings().then(setSiteSettings);

      const isNew = searchParams.get('new') === 'true';

      // 1. Load Auth & Existing Order
      if (authUser) {
        setCurrentUser(authUser);
        
        const orders = await api.getOrders();
        const existing = orders.find((o: Order) => 
          o.customerUid === authUser.uid && 
          o.status === 'confirm' &&
          o.vendorId === vendorId
        );
        if (existing && !isNew) {
          setExistingOrderId(existing.id);
          setIsPaid(true);
        }
      }

      // 2. Load Vendor Info
      const foundVendor = await api.getUser(vendorId);
      setVendor(foundVendor);

      // 3. Load Price List base structure
      const myServices = await api.getVendorPriceList(vendorId);
      let initialCart = [];
      
      if (myServices && myServices.length > 0) {
        initialCart = myServices.map((vs: any) => {
          const services = [
            { name: 'Wash', price: vs.washPrice, disabled: vs.washDisabled },
            { name: 'Iron', price: vs.ironPrice, disabled: vs.ironDisabled },
            { name: 'Wash + Iron', price: vs.washIronPrice, disabled: vs.washIronDisabled },
            { name: 'S+Iron', price: vs.starchIronPrice, disabled: vs.starchIronDisabled },
            { name: 'S+W+I', price: vs.starchWashIronPrice, disabled: vs.starchWashIronDisabled }
          ].filter(s => !s.disabled && s.price !== -1 && s.price !== undefined);

          return {
            id: vs._id || vs.id,
            name: vs.itemName || vs.name,
            desc: vs.category || 'Professional Cleaning',
            icon: vs.icon === 'Bed' ? Bed : (vs.icon === 'Shirt' ? Shirt : ShoppingBag),
            unit: 'unit',
            count: 0,
            services: services.length > 0 ? services : [{ name: 'Standard Wash', price: (typeof vs.washPrice === 'number' ? vs.washPrice : 500) }],
            selectedService: services.length > 0 ? (services.find(s => s.name === 'Wash') ? 'Wash' : services[0].name) : 'Standard Wash',
            hasStainRemover: false,
            stainRemoverPrice: (typeof vs.whitePremium === 'number' ? vs.whitePremium : 500),
            basePrice: services.length > 0 ? services[0].price : (typeof vs.washPrice === 'number' ? vs.washPrice : 500),
            subItems: (vs.subItems && vs.subItems.length > 0) ? vs.subItems.map((si: any) => ({ ...si, count: 0 })) : undefined
          };
        });
      } else if (vendorId) {
        // Fallback to default items only if no vendor-specific services exist
        initialCart = defaultItems.map(item => ({ ...item, count: 0 }));
      }

      // 4. Restore Saved Count Data (Skip if isNew)
      if (authUser?.uid && !isNew) {
        try {
          const userDrafts = await api.getDrafts(authUser.uid);
          const currentDraft = userDrafts.find(d => d.vendorId === vendorId);
          
          if (currentDraft && currentDraft.items) {
            const savedCart = currentDraft.items;
            initialCart = initialCart.map(item => {
              const savedItem = savedCart.find((p: any) => p.id === item.id || p.name === item.name);
              if (savedItem) {
                return { 
                  ...item, 
                  count: savedItem.count || 0,
                  selectedService: savedItem.selectedService || item.selectedService,
                  hasStainRemover: !!savedItem.hasStainRemover,
                  subItems: item.subItems ? item.subItems.map(si => {
                    const savedSi = savedItem.subItems?.find((ssi: any) => ssi.id === si.id || ssi.name === si.name);
                    return savedSi ? { ...si, count: savedSi.count || 0 } : si;
                  }) : undefined
                };
              }
              return item;
            });
          }
        } catch (e) {
          console.error('Failed to fetch drafts', e);
        }
      } else if (authUser?.uid && isNew) {
        await api.deleteDraft(authUser.uid, vendorId || '');
      }

      setCart(initialCart);
      setIsInitialized(true);
    };

    initPage();
  }, [vendorId, searchParams, authUser]);

  // Save to backend draft whenever cart changes AFTER initialization (debounced)
  React.useEffect(() => {
    if (isInitialized && currentUser?.uid && vendorId) {
      const activeItems = cart.filter(i => i.count > 0);
      if (activeItems.length === 0) {
        api.deleteDraft(currentUser.uid, vendorId);
        return;
      }

      const timer = setTimeout(() => {
        api.saveDraft(currentUser.uid, vendorId, cart);
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
  }, [cart, currentUser, vendorId, isInitialized]);

  const updateCount = (id: string, delta: number) => {
    if (isPaid) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item
    ));
  };

  const updateSubItemCount = (itemId: string, subItemId: string, delta: number) => {
    if (isPaid) return;
    setCart(prev => prev.map(item => {
      if (item.id === itemId && item.subItems) {
        const newSubItems = item.subItems.map(si => 
          si.id === subItemId ? { ...si, count: Math.max(0, si.count + delta) } : si
        );
        const newTotalCount = newSubItems.reduce((acc, si) => acc + si.count, 0);
        return { ...item, subItems: newSubItems, count: newTotalCount };
      }
      return item;
    }));
  };

  const updateService = (id: string, serviceName: string, e?: React.MouseEvent) => {
    if (isPaid) return;
    if (e) e.stopPropagation(); // Prevent card onClick from firing
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, selectedService: serviceName } : item
    ));
  };

  const toggleStainRemover = (id: string, e?: React.MouseEvent) => {
    if (isPaid) return;
    if (e) e.stopPropagation(); // Prevent card onClick from firing
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, hasStainRemover: !item.hasStainRemover } : item
    ));
  };

  const getItemPrice = (item: any) => {
    if (item.subItems && item.subItems.length > 0) {
      const subTotal = item.subItems.reduce((acc: number, si: any) => {
        const p = typeof si.price === 'string' ? parseFloat(si.price.replace(/[^0-9.]/g, '')) : Number(si.price);
        return acc + ((Number(si.count) || 0) * (p || 0));
      }, 0);
      const stainPrice = item.hasStainRemover ? (Number(item.stainRemoverPrice) || 0) : 0;
      return subTotal + ((Number(item.count) || 0) > 0 ? stainPrice : 0);
    }
    const service = item.services?.find((s: any) => s.name === item.selectedService);
    let sPrice = service ? (service.price ?? item.basePrice ?? 0) : (item.basePrice ?? 0);
    if (typeof sPrice === 'string') sPrice = parseFloat(sPrice.replace(/[^0-9.]/g, '')) || 0;
    
    const stainPrice = item.hasStainRemover ? (Number(item.stainRemoverPrice) || 0) : 0;
    const count = Number(item.count) || 0;
    return (count * (Number(sPrice) || 0)) + (count > 0 ? stainPrice : 0);
  };

  const totalItems = cart.reduce((acc, item) => acc + (Number(item.count) || 0), 0);
  const itemsPrice = cart.reduce((acc, item) => acc + (Number(getItemPrice(item)) || 0), 0);
  const [riderFee, setRiderFee] = React.useState(0);
  const totalPrice = totalItems > 0 ? (Number(itemsPrice) || 0) + (Number(riderFee) || 0) : 0;

  // Update rider fee when landmark changes
  React.useEffect(() => {
    if (pickupLandmark) {
      setRiderFee(calculateRiderFee(pickupLandmark));
    }
  }, [pickupLandmark]);

  // Load existing order details if any
  const [existingOrder, setExistingOrder] = React.useState<Order | null>(null);
  React.useEffect(() => {
    const loadOrder = async () => {
      if (existingOrderId) {
        const found = await api.getOrder(existingOrderId);
        setExistingOrder(found);
      }
    };
    loadOrder();
  }, [existingOrderId]);

  const handlePayment = React.useCallback(async () => {
    if (!currentUser?.uid) {
      setNotification({ message: "Please login to proceed.", type: 'error' });
      return;
    }
    
    const currentUserData = await api.getUser(currentUser.uid);
    if (!currentUserData) {
      setNotification({ message: "User session error. Please login again.", type: 'error' });
      return;
    }
    
    // Check wallet balance ONLY if wallet is selected
    if (paymentMethod === 'wallet' && (Number(currentUserData.walletBalance) || 0) < totalPrice) {
      setIsPaying(true);
      setNotification({ 
        message: `Insufficient balance! Balance: ₦${(Number(currentUserData.walletBalance) || 0).toLocaleString()}. Total: ₦${totalPrice.toLocaleString()}. Redirecting to wallet...`, 
        type: 'error' 
      });
      
      setTimeout(() => {
        setNotification(null);
        router.push('/wallet');
      }, 2000);
      return;
    }

    setIsPaying(true);
    
    const isWalletPayment = paymentMethod === 'wallet';
    const delay = isWalletPayment ? 2000 : 4000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const itemsDescription = cart.filter(i => i.count > 0).map(i => {
      const servicePrice = i.services.find((s: any) => s.name === i.selectedService)?.price || 0;
      const itemTotalPrice = servicePrice * i.count;
      
      if (i.subItems) {
        const activeSubs = i.subItems.filter((si: any) => si.count > 0);
        const subDesc = activeSubs.map((si: any) => `${si.count}x ${si.name} (₦${(si.price * si.count).toLocaleString()})`).join(', ');
        return `${subDesc} [${i.name} - ${i.selectedService}]`;
      }
      return `${i.count}x ${i.name} [${i.selectedService}] - ₦${itemTotalPrice.toLocaleString()}`;
    }).join(', ');

    const newOrderId = generateId();
    
    const newOrder: Order = {
      id: newOrderId,
      customerUid: currentUserData.uid,
      customerName: currentUserData.fullName || 'Guest',
      customerPhone: currentUserData.phoneNumber || '',
      customerLandmark: pickupLandmark,
      customerAddress: pickupAddress,
      items: itemsDescription,
      itemsPrice,
      riderFee,
      totalPrice,
      status: 'confirm',
      time: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      color: 'bg-warning/20 text-warning',
      
      vendorId: vendorId || vendor?.uid || '',
      vendorName: vendor?.fullName || vendor?.shopName || 'Quick-Wash Partner',
      vendorPhone: vendor?.phoneNumber || '',
      vendorAddress: vendor?.address || vendor?.shopAddress || '',
      vendorLandmark: vendor?.landmark || '',
      
      code1: Math.floor(1000 + Math.random() * 9000).toString(),
      code2: Math.floor(1000 + Math.random() * 9000).toString(),
      code3: Math.floor(1000 + Math.random() * 9000).toString(),
      code4: Math.floor(1000 + Math.random() * 9000).toString(),
      
      paidAt: new Date().toISOString(),
      paymentMethod
    } as any;

    try {
      // The API Handles wallet deduction and transaction recording
      const result = await api.saveOrder(newOrder);
      const serverOrderId = result.id || newOrderId;
      console.log(`[Order] Payment successful. Server Order ID: ${serverOrderId}`);
      
      if (currentUser?.uid) {
        api.updateUser(currentUser.uid, { currentOrderId: serverOrderId });
        updateUser({ currentOrderId: serverOrderId });
      }
      
      setExistingOrderId(serverOrderId);
      
      if (currentUser?.uid && vendorId) {
        await api.deleteDraft(currentUser.uid, vendorId);
      }
      
      setNotification({ message: `Payment via ${paymentMethod} successful!`, type: 'success' });
      setIsPaid(true);
      setIsPaying(false);

      if (isWalletPayment) {
        // Use result from backend directly if available, otherwise refetch
        if (result && result.updatedWalletBalance !== undefined) {
          const updatedUserBalance = { walletBalance: result.updatedWalletBalance };
          updateUser(updatedUserBalance);
          setCurrentUser(prev => prev ? { ...prev, ...updatedUserBalance } : null);
        } else {
          // Fallback refetch
          const updatedUser = await api.getUser(currentUser.uid);
          if (updatedUser) {
            updateUser(updatedUser);
            setCurrentUser(updatedUser);
          }
        }
      } else {
        // For non-wallet payments, just double check user data
        if (currentUser?.uid) {
          const updatedUser = await api.getUser(currentUser.uid);
          if (updatedUser) {
            updateUser(updatedUser);
            setCurrentUser(updatedUser);
          }
        }
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Payment failed:', error);
      setIsPaying(false);
      const errorMsg = error.message && error.message.startsWith('{') ? JSON.parse(error.message).error : error.message;
      setNotification({ message: errorMsg || "Payment failed. Please try again.", type: 'error' });
    }
  }, [currentUser, totalPrice, itemsPrice, riderFee, vendorId, vendor, router, cart, pickupAddress, pickupLandmark, paymentMethod, updateUser]);

  const handlePaymentClick = () => {
    if (!pickupLandmark) {
      setShowLocationModal(true);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePickupRequest = React.useCallback(async () => {
    let orderId = existingOrderId || currentUser?.currentOrderId;
    console.log(`[Order] Requesting pickup for Order ID: ${orderId}`);
    
    if (!orderId) {
      setNotification({ message: "Order ID missing. Please refresh and try again.", type: 'error' });
      return;
    }

    if (!pickupLandmark || !pickupAddress) {
      setNotification({ message: "Pickup location is required.", type: 'error' });
      setShowLocationModal(true);
      return;
    }

    try {
      let order = await api.getOrder(orderId);
      
      // If not found by ID, try finding a recent pending order as a fallback
      if (!order && currentUser?.uid) {
        console.warn(`[Order] Order ${orderId} not found, searching for user's most recent confirm order...`);
        const allOrders = await api.getOrders();
        const mostRecent = allOrders.find(o => 
          o.customerUid === currentUser.uid && 
          o.status === 'confirm' && 
          o.vendorId === vendorId
        );
        if (mostRecent) {
          console.log(`[Order] Found fallback order: ${mostRecent.id}`);
          order = mostRecent;
          orderId = mostRecent.id;
          setExistingOrderId(orderId);
          if (currentUser?.uid) {
            api.updateUser(currentUser.uid, { currentOrderId: orderId });
            updateUser({ currentOrderId: orderId });
          }
        }
      }

      if (order) {
        await api.saveOrder({
          ...order,
          status: 'rider_assign_pickup',
          customerAddress: pickupAddress,
          customerLandmark: pickupLandmark,
          color: 'bg-primary-container text-on-primary-container',
        });
        
        if (currentUser?.uid) {
          api.updateUser(currentUser.uid, { currentOrderId: undefined });
          updateUser({ currentOrderId: undefined });
        }
        setNotification({ message: 'Order confirmed! Redirecting to tracking...', type: 'success' });
        
        setTimeout(() => {
          setNotification(null);
          router.push('/track');
        }, 2000);
      } else {
        throw new Error(`Order ${orderId} not found in database.`);
      }
    } catch (err: any) {
      console.error('[Order] Pickup request failed:', err);
      setNotification({ message: err.message || 'Pickup request failed. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  }, [router, existingOrderId, pickupAddress, pickupLandmark, currentUser, vendorId, updateUser]);

  const showActionRequired = existingOrder?.status === 'Action Required' || existingOrder?.status === 'rider_assign_pickup' || existingOrder?.status === 'confirm';

  const handleCancelOrder = async () => {
    if (!existingOrder || !currentUser?.uid) return;
    if (!confirm("Are you sure you want to cancel this order? Your payment will be refunded to your wallet.")) return;

    try {
      setIsPaying(true);
      const token = localStorage.getItem('qw_token');
      const res = await fetch(`/api/orders/${existingOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'User Cancelled' })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to cancel order');
      }

      // Refresh user balance
      const updatedUser = await api.getUser(currentUser.uid);
      if (updatedUser) {
        updateUser(updatedUser);
        setCurrentUser(updatedUser);
      }

      // Reset state
      setExistingOrderId(null);
      setExistingOrder(null);
      setIsPaid(false);
      
      if (currentUser?.uid) {
        api.updateUser(currentUser.uid, { currentOrderId: undefined });
        updateUser({ currentOrderId: undefined });
      }
      
      setNotification({ message: "Order cancelled and refunded successfully.", type: 'success' });
      setIsPaying(false);
    } catch (error: any) {
      console.error("Cancellation failed", error);
      setIsPaying(false);
      setNotification({ message: error.message || "Failed to cancel order. Please try again.", type: 'error' });
    }
  };

  if (vendorId && !isInitialized) {
    return (
      <div className="min-h-screen bg-mint flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-2xl font-headline font-black text-on-surface mb-2 tracking-tight">Resuming your order...</h2>
        <p className="text-on-surface-variant font-medium text-sm">Please wait while we load the vendor list and your previous selections.</p>
      </div>
    );
  }

  return (
    <div className="pb-64">
      <TopAppBar showAudioToggle />
      
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
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4",
              isPaid ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            )}
          >
            {isPaid ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4 fill-current" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isPaid ? 'Payment Confirmed' : 'Premium Service Selected'}
            </span>
          </motion.div>
          <h1 className="text-[4rem] leading-[0.9] font-headline font-black text-on-surface mb-4 tracking-tighter">
            {isPaid ? 'Order Secured.' : "Let's get started."}
          </h1>
          <p className="text-on-surface-variant font-medium text-xl leading-relaxed max-w-xl">
            {showActionRequired 
              ? `Your payment to ${vendor?.shopName || 'Quick-Wash'} was successful. Please review your items and request a pickup.`
              : `Ordering from ${vendor?.shopName || 'Quick-Wash Station'}. What are we cleaning today?`
            }
          </p>
        </header>

        {showActionRequired ? (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-surface-container-low rounded-[3rem] p-8 border-2 border-primary/10 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-2xl text-on-surface">Order Details</h3>
                  <p className="font-bold text-xs text-on-surface-variant uppercase tracking-widest">Order ID: #{existingOrderId}</p>
                </div>
              </div>

              <div className="bg-white/40 rounded-[2rem] p-6 mb-8 border border-primary/5">
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Paid Items</p>
                <div className="space-y-4">
                  {existingOrder?.items.split(',').map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="font-headline font-black text-on-surface leading-tight">{item.trim()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-warning-dark bg-warning/10 p-4 rounded-2xl border border-warning/20">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  Important: Your order is confirmed but <strong>Riders have not been notified yet</strong>. Click &quot;I am Ready&quot; below to request a pickup.
                </p>
              </div>
            </div>
          </motion.section>
        ) : (
          <>
            <section className="bg-surface-container-low rounded-[2.5rem] p-8 mb-12 border border-primary/5 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-white p-4 rounded-3xl shadow-xl text-primary">
                  <Bolt className="w-8 h-8 fill-current" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-on-surface text-xl">Express Pickup</h3>
                  <p className="font-medium text-on-surface-variant">Rider arrives in less than 15 mins</p>
                </div>
              </div>
              <div className="bg-primary text-white px-4 py-2 rounded-xl font-headline font-black text-xs">
                FREE
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cart.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    if (!isPaid && (!item.subItems || item.subItems.length === 0)) {
                      updateCount(item.id, 1);
                    }
                  }}
                  className={cn(
                    "rounded-[3rem] p-8 border border-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/5 bg-surface-container-low flex flex-col h-full cursor-pointer",
                    item.count > 0 && "ring-4 ring-primary-container"
                  )}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl">
                        <item.icon className="text-primary w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-headline font-black">{item.name}</h3>
                        <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1">
                    {item.subItems && item.subItems.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 mb-6">
                        {item.subItems.map(si => (
                          <div key={si.id} className="bg-white/50 p-4 rounded-2xl border border-primary/5 flex items-center justify-between">
                            <div>
                              <p className="font-headline font-black text-xs">{si.name}</p>
                              <p className="text-[10px] font-bold text-on-surface-variant">₦{si.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateSubItemCount(item.id, si.id, -1); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container active:scale-90 transition-transform"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-headline font-black text-sm min-w-[1.5ch] text-center">{si.count}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateSubItemCount(item.id, si.id, 1); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white active:scale-90 transition-transform"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto space-y-4">
                      {/* Stain Remover Toggle Row */}
                      {item.count > 0 && (
                        <div 
                          onClick={(e) => toggleStainRemover(item.id, e)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all",
                            item.hasStainRemover 
                              ? "bg-tertiary/10 border-tertiary/30" 
                              : "bg-white/40 border-primary/5 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles className={cn("w-4 h-4", item.hasStainRemover ? "text-tertiary fill-current" : "text-on-surface-variant")} />
                            <span className="font-headline font-black text-[10px] uppercase tracking-wider">White</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-on-surface-variant">+₦{item.stainRemoverPrice}</span>
                            <div className={cn(
                              "w-8 h-4 rounded-full relative transition-colors",
                              item.hasStainRemover ? "bg-tertiary" : "bg-outline/20"
                            )}>
                              <motion.div 
                                animate={{ x: item.hasStainRemover ? 16 : 2 }}
                                className="absolute top-1 w-2 h-2 bg-white rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Service Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {item.services.map(service => (
                          <button 
                            key={service.name}
                            onClick={(e) => updateService(item.id, service.name, e)}
                            className={cn(
                              "px-3 py-3 rounded-xl font-headline font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 text-center",
                              item.selectedService === service.name 
                                ? "signature-gradient text-white shadow-md" 
                                : "bg-white text-on-surface-variant hover:bg-surface-container-highest border border-primary/5"
                            )}
                          >
                            {service.name}
                            <span className="block text-[8px] opacity-60 mt-0.5">₦{service.price}</span>
                          </button>
                        ))}
                      </div>

                      {/* Quantity Selector - Moved inside card below services */}
                      {(!item.subItems || item.subItems.length === 0) && (
                        <div className="flex items-center justify-between bg-white p-3 rounded-[2rem] shadow-xl border border-primary/5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateCount(item.id, -1); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container hover:bg-primary-container/30 transition-colors active:scale-90"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input 
                            type="number"
                            value={item.count}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              updateCount(item.id, val - item.count);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="font-headline font-black text-2xl px-2 w-20 text-center bg-transparent outline-none ring-0"
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateCount(item.id, 1); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary text-white hover:opacity-90 active:scale-90 transition-all shadow-lg shadow-primary/20"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-primary/5">
                    <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] font-label font-bold uppercase tracking-widest">
                        {(item.subItems && item.subItems.length > 0) ? 'Custom' : `₦${item.basePrice}/${item.unit}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline font-black text-2xl text-primary">₦{(getItemPrice(item) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-12">
        <div className="bg-white/95 backdrop-blur-3xl rounded-[3rem] px-8 pt-10 pb-12 shadow-[0_-20px_60px_rgba(0,106,40,0.05)] border border-primary/5">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">
                  {showActionRequired ? 'Order Paid' : 'Cart Summary'}
                </p>
                <h3 className="font-headline font-black text-3xl text-on-surface">
                  {showActionRequired ? `Order #${existingOrder?.id || '...'}` : `${totalItems.toString().padStart(2, '0')} Items Selected`}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">
                  {showActionRequired ? 'Total Paid' : 'Estimated Total'}
                </p>
                <h3 className="font-headline font-black text-5xl text-primary tracking-tighter">
                  ₦{(showActionRequired ? (existingOrder?.totalPrice || 0) : (totalPrice || 0)).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {!showActionRequired && totalItems > 0 && (
              <div className="mb-8 p-6 bg-surface-container rounded-[2rem] border border-primary/5 space-y-3">
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Detailed Breakdown</p>
                {cart.filter(item => item.count > 0).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-headline font-black text-on-surface">
                        {item.count}x {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        {item.selectedService} {item.hasStainRemover && '+ Stain Remover'}
                      </span>
                    </div>
                    <span className="font-headline font-black text-on-surface">₦{getItemPrice(item).toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-primary/10 flex justify-between text-sm">
                  <span className="font-headline font-black text-on-surface-variant">Rider Fee (Express)</span>
                  <span className="font-headline font-black text-on-surface">₦{riderFee.toLocaleString()}</span>
                </div>
              </div>
            )}
            
            {!showActionRequired ? (
              <div className="space-y-6">
                {/* Location Preview */}
                <div 
                  onClick={() => setShowLocationModal(true)}
                  className="p-6 bg-surface-container rounded-[2rem] border border-primary/10 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Pickup Location</p>
                      <p className="font-headline font-black text-on-surface">
                        {pickupLandmark ? `${pickupLandmark}${pickupAddress ? `, ${pickupAddress}` : ''}` : 'Select Pickup Location'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </div>

                <button 
                  onClick={handlePaymentClick}
                  disabled={totalItems === 0 || isPaying || currentUser?.status === 'restricted'}
                  className="w-full h-20 bg-primary text-white rounded-[2rem] font-headline font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  {isPaying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : currentUser?.status === 'restricted' ? (
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6" />
                      <span>ACCOUNT RESTRICTED</span>
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      Pay ₦{(totalPrice || 0).toLocaleString()}
                    </>
                  )}
                </button>
                {currentUser?.status === 'restricted' && (
                  <p className="text-center text-[10px] font-bold text-error uppercase tracking-widest">
                    Low Trust Points ({currentUser.trustPoints}). Restriction expires {currentUser.restrictionExpires ? new Date(currentUser.restrictionExpires).toLocaleDateString() : 'soon'}.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <ReadyForPickupButton onClick={handlePickupRequest} />
                <button 
                  onClick={handleCancelOrder}
                  disabled={isPaying}
                  className="w-full h-16 bg-error/10 text-error rounded-3xl font-headline font-black text-xs uppercase tracking-widest border border-error/20 hover:bg-error/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel Order & Refund
                </button>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 text-[10px] font-label font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-40">
                <ShieldCheck className="w-3 h-3" />
                Your clothes will be clean and fresh
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-8 sm:hidden" />
              <h3 className="text-3xl font-headline font-black text-on-surface mb-2">Payment Method</h3>
              <p className="text-on-surface-variant font-medium mb-8">Choose how you want to pay.</p>

              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod('wallet')}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all",
                    paymentMethod === 'wallet' ? "bg-primary/5 border-primary" : "bg-surface-container border-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Wallet className={cn("w-6 h-6", paymentMethod === 'wallet' ? "text-primary" : "text-on-surface-variant")} />
                    <div className="text-left">
                      <p className="font-headline font-black text-sm">Wallet Balance</p>
                      <p className="text-[10px] font-bold text-on-surface-variant">Balance: ₦{(currentUser?.walletBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && <Check className="w-5 h-5 text-primary" />}
                </button>

                <p className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">
                  Note: Top up your wallet to pay for orders
                </p>

                <button 
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    handlePayment();
                  }}
                  disabled={isPaying || (paymentMethod === 'wallet' && (currentUser?.walletBalance || 0) < totalPrice)}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isPaying ? 'PROCESSING...' : 
                   (paymentMethod === 'wallet' && (currentUser?.walletBalance || 0) < totalPrice) ? 'INSUFFICIENT BALANCE' : `PAY ₦${totalPrice.toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location Selection Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-8 sm:hidden" />
              <h3 className="text-3xl font-headline font-black text-on-surface mb-2">Pickup Location</h3>
              <p className="text-on-surface-variant font-medium mb-8">Where should the rider meet you?</p>

              <div className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Select Landmark</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(siteSettings?.landmarks || ['Under-G', 'Adenike', 'Isale-General', 'Stadium', 'Bovina', 'LAUTECH Gate']).filter((l: any) => typeof l === 'string' || l.active).map((l: any) => {
                      const name = typeof l === 'string' ? l : l.name;
                      return (
                        <button
                          key={name}
                          onClick={() => setPickupLandmark(name)}
                          className={cn(
                            "px-4 py-3 rounded-xl font-headline font-black text-xs transition-all border",
                            pickupLandmark === name ? "bg-primary text-white border-primary shadow-lg" : "bg-surface-container border-primary/5 text-on-surface-variant"
                          )}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Detailed Address (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Block 4, Room 12, Green Hostel"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full h-14 bg-surface-container rounded-2xl px-6 font-headline font-black text-sm outline-none focus:ring-2 ring-primary transition-all"
                  />
                </div>

                <button 
                  onClick={() => {
                    if (pickupLandmark) setShowLocationModal(false);
                  }}
                  disabled={!pickupLandmark}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  CONFIRM LOCATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
