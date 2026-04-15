'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/shared/TopAppBar';
import ReadyForPickupButton from '@/components/shared/ReadyForPickupButton';
import { Minus, Plus, Sparkles, Shirt, ShoppingBag, Bed, CreditCard, Bolt, Info, ChevronRight, ShieldCheck, Check } from 'lucide-react';
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

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor');
  const [cart, setCart] = React.useState(defaultItems);
  const [isPaid, setIsPaid] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [vendor, setVendor] = React.useState<any>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [existingOrderId, setExistingOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('qw_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      
      // Check for existing paid but unconfirmed orders
      const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const existing = orders.find((o: any) => 
        o.customerPhone === user.phoneNumber && 
        o.status === 'confirm' &&
        (vendorId ? o.vendorId === vendorId : true)
      );
      if (existing) {
        setExistingOrderId(existing.id);
        setIsPaid(true);
      }
    }
  }, [vendorId]);

  // Load vendor services
  React.useEffect(() => {
    if (vendorId) {
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const foundVendor = allUsers.find((u: any) => u.phoneNumber === vendorId);
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
          basePrice: vs.washPrice
        }));
        setCart(mapped);
      } else {
        setCart(defaultItems);
      }
    }
  }, [vendorId]);

  // Persistence: Load from localStorage if exists
  React.useEffect(() => {
    if (!currentUser?.phoneNumber) return;
    const savedCart = localStorage.getItem(`qw_pending_cart_${currentUser.phoneNumber}`);
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
  }, [currentUser]);

  // Save to localStorage whenever cart changes
  React.useEffect(() => {
    if (currentUser?.phoneNumber) {
      localStorage.setItem(`qw_pending_cart_${currentUser.phoneNumber}`, JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  const updateCount = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item
    ));
  };

  const updateSubItemCount = (itemId: string, subItemId: string, delta: number) => {
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
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, selectedService: serviceName } : item
    ));
  };

  const toggleStainRemover = (id: string) => {
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

  const totalItems = cart.reduce((acc, item) => acc + item.count, 0);
  const totalPrice = cart.reduce((acc, item) => acc + getItemPrice(item), 0);

  // Load existing order details if any
  const [existingOrder, setExistingOrder] = React.useState<any>(null);
  React.useEffect(() => {
    if (existingOrderId) {
      const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const found = orders.find((o: any) => o.id === existingOrderId);
      setExistingOrder(found);
    }
  }, [existingOrderId]);

  const handlePayment = React.useCallback(async () => {
    const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const currentUserData = allUsers.find((u: any) => u.phoneNumber === currentUser?.phoneNumber) || currentUser;
    
    // Check wallet balance
    if ((currentUserData.walletBalance || 0) < totalPrice) {
      if (confirm(`Insufficient balance. Your balance is ₦${(currentUserData.walletBalance || 0).toLocaleString()}. Would you like to fund your wallet now?`)) {
        router.push('/wallet');
      }
      return;
    }

    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    
    const itemsDescription = cart.filter(i => i.count > 0).map(i => {
      if (i.subItems) {
        const subDesc = i.subItems.filter(si => si.count > 0).map(si => `${si.count}x ${si.name}`).join(', ');
        return `${subDesc} (${i.selectedService})`;
      }
      return `${i.count}x ${i.name} (${i.selectedService})`;
    }).join(', ');

    const newOrderId = generateId();
    const handoverCode = generateId();
    
    // Platform Commission: 10% + ₦300
    const commission = (totalPrice * 0.1) + 300;

    // Rider Fee: Fixed ₦500 + Dynamic (₦100 per km, simulated 1-5km)
    const riderFee = calculateRiderFee();
    
    const newOrder = {
      id: newOrderId,
      customerName: currentUserData.fullName || 'Guest',
      customerPhone: currentUserData.phoneNumber,
      customerLandmark: currentUserData.landmark || 'Main Gate',
      items: itemsDescription,
      totalPrice,
      commission,
      riderFee,
      status: 'confirm',
      time: new Date().toISOString(),
      color: 'bg-warning/20 text-warning',
      vendorId: vendorId || 'campus-cleans',
      vendorName: vendor?.shopName || 'Quick-Wash Partner',
      vendorLandmark: vendor?.landmark || 'Campus Center',
      vendorPhone: vendor?.phoneNumber || '08012345678',
      handoverCode: handoverCode,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      paymentMethod: 'Wallet'
    };

    // Update users (Wallet deduction and Admin commission)
    const updatedUsers = allUsers.map((u: any) => {
      if (u.phoneNumber === currentUserData.phoneNumber) {
        const updated = { ...u, walletBalance: u.walletBalance - totalPrice };
        localStorage.setItem('qw_user', JSON.stringify(updated));
        setCurrentUser(updated);
        return updated;
      }
      if (u.role === 'admin' && u.phoneNumber === '09012345678') {
        return { ...u, walletBalance: (u.walletBalance || 0) + commission };
      }
      return u;
    });
    localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));

    // Record Wallet History
    const newHistory = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'payment',
      amount: totalPrice,
      date: new Date().toISOString(),
      desc: `Payment for Order #${newOrderId}`
    };
    const currentHistory = JSON.parse(localStorage.getItem(`qw_wallet_history_${currentUserData.phoneNumber}`) || '[]');
    localStorage.setItem(`qw_wallet_history_${currentUserData.phoneNumber}`, JSON.stringify([newHistory, ...currentHistory]));

    orders.push(newOrder);
    localStorage.setItem('qw_orders', JSON.stringify(orders));
    localStorage.setItem('qw_current_order_id', newOrderId);
    if (currentUser?.phoneNumber) {
      localStorage.removeItem(`qw_pending_cart_${currentUser.phoneNumber}`);
    }
    
    setIsPaid(true);
    setIsPaying(false);
    alert(`₦${totalPrice.toLocaleString()} deducted from wallet. Payment Successful! Please click "I'M READY FOR PICKUP" when you are ready.`);
  }, [currentUser, totalPrice, vendorId, vendor, router, cart]);

  const handlePickupRequest = React.useCallback(() => {
    const orderId = existingOrderId || localStorage.getItem('qw_current_order_id');
    if (!orderId) return;

    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = orders.map((o: any) => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: 'rider_assign_pickup', 
          pickupCode: Math.floor(1000 + Math.random() * 9000).toString(),
          color: 'bg-primary-container text-on-primary-container',
          confirmedAt: new Date().toISOString()
        };
      }
      return o;
    });

    localStorage.setItem('qw_orders', JSON.stringify(updated));
    localStorage.removeItem('qw_current_order_id');
    alert('Order confirmed! A rider will be assigned shortly.');
    router.push('/track');
  }, [router, existingOrderId]);

  return (
    <div className="pb-64">
      <TopAppBar showAudioToggle />
      
      <main className="pt-8 px-6 max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cart.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "rounded-[3rem] p-8 border border-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/5 bg-surface-container-low flex flex-col min-h-[600px]",
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
                {!item.subItems && (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] shadow-xl">
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
            <div className="flex justify-between items-end mb-10">
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
            
            {!isPaid ? (
              <button 
                onClick={handlePayment}
                disabled={totalItems === 0 || isPaying}
                className="w-full h-20 bg-primary text-white rounded-[2rem] font-headline font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isPaying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    Pay ₦{(totalPrice || 0).toLocaleString()}
                  </>
                )}
              </button>
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
    </div>
  );
}
