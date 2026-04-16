'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/shared/TopAppBar';
import ReadyForPickupButton from '@/components/shared/ReadyForPickupButton';
import { Minus, Plus, Sparkles, Shirt, ShoppingBag, Bed, CreditCard, Bolt, Info, ChevronRight, ShieldCheck, Check, MapPin, ShieldAlert, Wallet, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from '@/lib/time';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

const calculateRiderFee = () => {
  const distance = Math.floor(Math.random() * 5) + 1;
  return 500 + (distance * 100);
};

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-headline font-black">Loading...</div>}>
      <OrderPageContent />
    </Suspense>
  );
}

import { db, Order, UserData } from '@/lib/DatabaseService';
import { Toast } from '@/components/shared/Toast';

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor');
  const [cart, setCart] = React.useState(defaultItems);
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

  React.useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('qw_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // Check for existing paid but unconfirmed orders - STRICT UID FILTERING
        const orders = await db.getOrders();
        const existing = orders.find((o: Order) => 
          o.customerUid === user.uid && 
          o.status === 'confirm' &&
          (vendorId ? o.vendorId === vendorId : true)
        );
        if (existing) {
          setExistingOrderId(existing.id);
          setIsPaid(true);
        } else {
          setExistingOrderId(null);
          setIsPaid(false);
        }
      }
    };
    init();
  }, [vendorId]);

  // Load vendor services
  React.useEffect(() => {
    const loadVendor = async () => {
      if (vendorId) {
        const foundVendor = await db.getUser(vendorId);
        setVendor(foundVendor);

        const vendorServices = JSON.parse(localStorage.getItem('qw_vendor_services') || '[]');
        const myServices = vendorServices.filter((s: any) => s.vendorId === vendorId);
        
        if (myServices.length > 0) {
          const mapped = myServices.map((vs: any) => ({
            id: vs.id.toString(),
            name: vs.name,
            desc: 'Professional Cleaning',
            icon: Shirt,
            unit: 'unit',
            count: 0,
            services: [
              { name: 'Wash', price: vs.washPrice },
              { name: 'Iron', price: vs.ironPrice },
              { name: 'Wash + Iron', price: vs.washIronPrice }
            ],
            selectedService: 'Wash',
            hasStainRemover: false,
            stainRemoverPrice: 500,
            basePrice: vs.washPrice,
            subItems: vs.subItems || []
          }));
          setCart(mapped);
        } else {
          setCart(defaultItems);
        }
      }
    };
    loadVendor();
  }, [vendorId]);

  // Persistence: Load from localStorage if exists
  React.useEffect(() => {
    if (!currentUser?.uid || !vendorId) return;
    const savedCart = localStorage.getItem(`qw_pending_cart_${currentUser.uid}_${vendorId}`);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(prev => prev.map(item => {
          const savedItem = parsed.find((p: any) => p.id === item.id);
          if (savedItem) {
            return { 
              ...item, 
              count: savedItem.count,
              selectedService: savedItem.selectedService,
              hasStainRemover: savedItem.hasStainRemover,
              subItems: item.subItems ? item.subItems.map(si => {
                const savedSi = savedItem.subItems?.find((ssi: any) => ssi.id === si.id);
                return savedSi ? { ...si, count: savedSi.count } : si;
              }) : undefined
            };
          }
          return item;
        }));
      } catch (e) {
        console.error('Failed to parse saved cart', e);
      }
    }
  }, [currentUser, vendorId]);

  // Save to localStorage whenever cart changes
  React.useEffect(() => {
    if (currentUser?.uid && vendorId) {
      localStorage.setItem(`qw_pending_cart_${currentUser.uid}_${vendorId}`, JSON.stringify(cart));
    }
  }, [cart, currentUser, vendorId]);

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

  const updateService = (id: string, serviceName: string) => {
    if (isPaid) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, selectedService: serviceName } : item
    ));
  };

  const toggleStainRemover = (id: string) => {
    if (isPaid) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, hasStainRemover: !item.hasStainRemover } : item
    ));
  };

  const getItemPrice = (item: any) => {
    if (item.subItems) {
      const subTotal = item.subItems.reduce((acc: number, si: any) => acc + ((Number(si.count) || 0) * (Number(si.price) || 0)), 0);
      const stainPrice = item.hasStainRemover ? (Number(item.stainRemoverPrice) || 0) : 0;
      return subTotal + ((Number(item.count) || 0) > 0 ? stainPrice : 0);
    }
    const service = item.services?.find((s: any) => s.name === item.selectedService);
    const servicePrice = service ? (service.price ?? item.basePrice ?? 0) : (item.basePrice ?? 0);
    const stainPrice = item.hasStainRemover ? (Number(item.stainRemoverPrice) || 0) : 0;
    const count = Number(item.count) || 0;
    return (count * (Number(servicePrice) || 0)) + (count > 0 ? stainPrice : 0);
  };

  const totalItems = cart.reduce((acc, item) => acc + (Number(item.count) || 0), 0);
  const itemsPrice = cart.reduce((acc, item) => acc + (Number(getItemPrice(item)) || 0), 0);
  const [riderFee] = React.useState(() => calculateRiderFee());
  const totalPrice = totalItems > 0 ? (Number(itemsPrice) || 0) + (Number(riderFee) || 0) : 0;

  // Load existing order details if any
  const [existingOrder, setExistingOrder] = React.useState<Order | null>(null);
  React.useEffect(() => {
    const loadOrder = async () => {
      if (existingOrderId) {
        const found = await db.getOrder(existingOrderId);
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
    
    const currentUserData = await db.getUser(currentUser.uid);
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
    
    // Longer delay for external payments
    const delay = paymentMethod === 'wallet' ? 2000 : 4000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const itemsDescription = cart.filter(i => i.count > 0).map(i => {
      if (i.subItems) {
        const subDesc = i.subItems.filter(si => si.count > 0).map(si => `${si.count}x ${si.name}`).join(', ');
        return `${subDesc} (${i.selectedService})`;
      }
      return `${i.count}x ${i.name} (${i.selectedService})`;
    }).join(', ');

    const newOrderId = generateId();
    const code1 = Math.floor(1000 + Math.random() * 9000).toString();
    
    const newOrder: Order = {
      id: newOrderId,
      customerUid: currentUserData.uid,
      customerName: currentUserData.fullName || 'Guest',
      customerPhone: currentUserData.phoneNumber,
      items: itemsDescription,
      itemsPrice,
      riderFee,
      totalPrice,
      status: 'confirm',
      code1,
      time: new Date().toISOString(),
      color: 'bg-warning/20 text-warning',
      vendorId: vendorId || 'campus-cleans',
      vendorName: vendor?.shopName || 'Quick-Wash Partner',
      vendorLandmark: vendor?.landmark,
      customerAddress: pickupAddress,
      customerLandmark: pickupLandmark,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      paymentMethod // Use the selected method
    } as any;

    try {
      if (paymentMethod === 'wallet') {
        const newBalance = (Number(currentUserData.walletBalance) || 0) - totalPrice;
        await db.updateUser(currentUserData.uid, { 
          walletBalance: newBalance 
        });

        await db.recordTransaction(currentUserData.uid, {
          type: 'payment',
          amount: totalPrice,
          desc: `Payment for Order #${newOrderId}`
        });
        setNotification({ message: `₦${totalPrice.toLocaleString()} deducted. Payment Successful!`, type: 'success' });
      } else {
        setNotification({ message: `Payment via ${paymentMethod} confirmed!`, type: 'success' });
      }

      await db.saveOrder(newOrder);
      localStorage.setItem('qw_current_order_id', newOrderId);
      setExistingOrderId(newOrderId);
      
      if (currentUser?.uid && vendorId) {
        localStorage.removeItem(`qw_pending_cart_${currentUser.uid}_${vendorId}`);
      }
      
      setIsPaid(true);
      setIsPaying(false);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Payment failed:', error);
      setIsPaying(false);
      setNotification({ message: "Payment failed. Please try again.", type: 'error' });
    }
  }, [currentUser, totalPrice, itemsPrice, riderFee, vendorId, vendor, router, cart, pickupAddress, pickupLandmark, paymentMethod]);

  const handlePaymentClick = () => {
    if (!pickupLandmark) {
      setShowLocationModal(true);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePickupRequest = React.useCallback(async () => {
    const orderId = existingOrderId || localStorage.getItem('qw_current_order_id');
    if (!orderId) return;

    // Use state values if they exist, otherwise error
    if (!pickupLandmark || !pickupAddress) {
      setNotification({ message: "Pickup location is required to proceed.", type: 'error' });
      setShowLocationModal(true);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const order = await db.getOrder(orderId);
    if (order) {
      await db.saveOrder({
        ...order,
        status: 'rider_assign_pickup',
        customerAddress: pickupAddress,
        customerLandmark: pickupLandmark,
        color: 'bg-primary-container text-on-primary-container',
      });
      
      localStorage.removeItem('qw_current_order_id');
      setNotification({ message: 'Order confirmed! Redirecting to tracking...', type: 'success' });
      
      // FEEDBACK LOOP: Mandatory 2000ms delay
      setTimeout(() => {
        setNotification(null);
        router.push('/track');
      }, 2000);
    }
  }, [router, existingOrderId, pickupAddress, pickupLandmark]);

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
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Premium Service Selected</span>
          </motion.div>
          <h1 className="text-[4rem] leading-[0.9] font-headline font-black text-on-surface mb-4 tracking-tighter">
            Let&apos;s get started.
          </h1>
          <p className="text-on-surface-variant font-medium text-xl leading-relaxed max-w-xl">
            Ordering from <span className="text-primary font-black">{vendor?.shopName || 'Quick-Wash Station'}</span>. What are we cleaning today?
          </p>
        </header>

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
              className={cn(
                "rounded-[3rem] p-8 border border-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/5 bg-surface-container-low flex flex-col h-full",
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
                {item.subItems && (
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {item.subItems.map(si => (
                      <div key={si.id} className="bg-white/50 p-4 rounded-2xl border border-primary/5 flex items-center justify-between">
                        <div>
                          <p className="font-headline font-black text-xs">{si.name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant">₦{si.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateSubItemCount(item.id, si.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container active:scale-90 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-headline font-black text-sm min-w-[1.5ch] text-center">{si.count}</span>
                          <button 
                            onClick={() => updateSubItemCount(item.id, si.id, 1)}
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
                      onClick={() => toggleStainRemover(item.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all",
                        item.hasStainRemover 
                          ? "bg-tertiary/10 border-tertiary/30" 
                          : "bg-white/40 border-primary/5 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className={cn("w-4 h-4", item.hasStainRemover ? "text-tertiary fill-current" : "text-on-surface-variant")} />
                        <span className="font-headline font-black text-[10px] uppercase tracking-wider">Stain Remover</span>
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
                        onClick={() => updateService(item.id, service.name)}
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
                  {!item.subItems && (
                    <div className="flex items-center justify-between bg-white p-3 rounded-[2rem] shadow-xl border border-primary/5">
                      <button 
                        onClick={() => updateCount(item.id, -1)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container hover:bg-primary-container/30 transition-colors active:scale-90"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="font-headline font-black text-2xl px-2 min-w-[2ch] text-center">{item.count}</span>
                      <button 
                        onClick={() => updateCount(item.id, 1)}
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
                    {item.subItems ? 'Custom' : `₦${item.basePrice}/${item.unit}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline font-black text-2xl text-primary">₦{(getItemPrice(item) || 0).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="mt-12">
        <div className="bg-white/95 backdrop-blur-3xl rounded-[3rem] px-8 pt-10 pb-12 shadow-[0_-20px_60px_rgba(0,106,40,0.05)] border border-primary/5">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">
                  {isPaid ? 'Order Paid' : 'Cart Summary'}
                </p>
                <h3 className="font-headline font-black text-3xl text-on-surface">
                  {isPaid ? `Order #${existingOrder?.id || '...'}` : `${totalItems.toString().padStart(2, '0')} Items Selected`}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">
                  {isPaid ? 'Total Paid' : 'Estimated Total'}
                </p>
                <h3 className="font-headline font-black text-5xl text-primary tracking-tighter">
                  ₦{(isPaid ? (existingOrder?.totalPrice || 0) : (totalPrice || 0)).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {!isPaid && totalItems > 0 && (
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
            
            {!isPaid ? (
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
              <ReadyForPickupButton onClick={handlePickupRequest} />
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

                <button 
                  onClick={() => setPaymentMethod('transfer')}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all",
                    paymentMethod === 'transfer' ? "bg-primary/5 border-primary" : "bg-surface-container border-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <History className={cn("w-6 h-6", paymentMethod === 'transfer' ? "text-primary" : "text-on-surface-variant")} />
                    <div className="text-left">
                      <p className="font-headline font-black text-sm">Bank Transfer</p>
                      <p className="text-[10px] font-bold text-on-surface-variant">Instant Confirmation</p>
                    </div>
                  </div>
                  {paymentMethod === 'transfer' && <Check className="w-5 h-5 text-primary" />}
                </button>

                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all",
                    paymentMethod === 'card' ? "bg-primary/5 border-primary" : "bg-surface-container border-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className={cn("w-6 h-6", paymentMethod === 'card' ? "text-primary" : "text-on-surface-variant")} />
                    <div className="text-left">
                      <p className="font-headline font-black text-sm">Debit Card</p>
                      <p className="text-[10px] font-bold text-on-surface-variant">Secure Payment</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <Check className="w-5 h-5 text-primary" />}
                </button>

                {paymentMethod === 'transfer' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-warning/10 rounded-2xl border border-warning/20"
                  >
                    <p className="text-[10px] font-black text-warning-dark uppercase tracking-widest mb-2">Transfer Details</p>
                    <p className="text-sm font-bold text-on-surface">Bank: Kuda Bank</p>
                    <p className="text-lg font-headline font-black text-on-surface">Account: 2031194566</p>
                    <p className="text-xs font-medium text-on-surface-variant">Name: Quick-Wash Laundry</p>
                  </motion.div>
                )}

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
                    {['Under-G', 'Adenike', 'Isale-General', 'Stadium', 'Bovina', 'LAUTECH Gate'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setPickupLandmark(l)}
                        className={cn(
                          "px-4 py-3 rounded-xl font-headline font-black text-xs transition-all border",
                          pickupLandmark === l ? "bg-primary text-white border-primary shadow-lg" : "bg-surface-container border-primary/5 text-on-surface-variant"
                        )}
                      >
                        {l}
                      </button>
                    ))}
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
