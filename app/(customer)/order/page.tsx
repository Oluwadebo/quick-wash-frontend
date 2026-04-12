'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/shared/TopAppBar';
import ReadyForPickupButton from '@/components/shared/ReadyForPickupButton';
import { Minus, Plus, Sparkles, Shirt, ShoppingBag, Bed, CreditCard, Bolt, Info, ChevronRight, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const items = [
  {
    id: 'shirts',
    name: 'Shirts & Tops',
    desc: 'Daily Essentials',
    icon: Shirt,
    basePrice: 200,
    unit: 'unit',
    count: 4,
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
    count: 2,
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
      { id: 'bedsheet', name: 'Bedsheet', count: 1, price: 400 },
      { id: 'duvet', name: 'Duvet', count: 0, price: 1200 },
      { id: 'pillowcase', name: 'Pillow Case', count: 2, price: 150 },
      { id: 'completeset', name: 'Complete Set', count: 0, price: 1800 }
    ]
  }
];

export default function OrderPage() {
  const router = useRouter();
  const [cart, setCart] = React.useState(items);
  const [isPaid, setIsPaid] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);

  // Persistence: Load from localStorage if exists
  React.useEffect(() => {
    const savedCart = localStorage.getItem('qw_pending_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save to localStorage whenever cart changes
  React.useEffect(() => {
    localStorage.setItem('qw_pending_cart', JSON.stringify(cart));
  }, [cart]);

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
      const subTotal = item.subItems.reduce((acc: number, si: any) => acc + (si.count * si.price), 0);
      const stainPrice = item.hasStainRemover ? item.stainRemoverPrice : 0;
      return subTotal + (item.count > 0 ? stainPrice : 0);
    }
    const service = item.services.find((s: any) => s.name === item.selectedService);
    const servicePrice = service ? service.price : item.basePrice;
    const stainPrice = item.hasStainRemover ? item.stainRemoverPrice : 0;
    return (item.count * servicePrice) + (item.count > 0 ? stainPrice : 0);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.count, 0);
  const totalPrice = cart.reduce((acc, item) => acc + getItemPrice(item), 0);

  const handlePayment = async () => {
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaid(true);
    setIsPaying(false);
    alert('Payment Successful! You can now request a pickup.');
  };

  const handlePickupRequest = React.useCallback(() => {
    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    
    const itemsDescription = cart.filter(i => i.count > 0).map(i => {
      if (i.subItems) {
        const subDesc = i.subItems.filter(si => si.count > 0).map(si => `${si.count}x ${si.name}`).join(', ');
        return `${subDesc} (${i.selectedService})`;
      }
      return `${i.count}x ${i.name} (${i.selectedService})`;
    }).join(', ');

    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customerName: currentUser.fullName || 'Guest',
      customerPhone: currentUser.phoneNumber,
      items: itemsDescription,
      totalPrice,
      status: 'Pending Pickup',
      time: 'Just now',
      color: 'bg-primary-container text-on-primary-container',
      vendorId: 'campus-cleans',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    localStorage.setItem('qw_orders', JSON.stringify(orders));
    localStorage.removeItem('qw_pending_cart'); // Clear pending cart after order
    alert('Order placed successfully! A rider will be assigned shortly.');
    router.push('/track');
  }, [cart, totalPrice, router]);

  return (
    <div className="pb-64">
      <TopAppBar showAudioToggle />
      
      <main className="pt-28 px-6 max-w-3xl mx-auto">
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
            What are we cleaning today? Select your items and how you want them handled.
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

        <div className="space-y-8">
          {cart.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "rounded-[3rem] p-8 border border-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/5 bg-surface-container-low",
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

              {item.subItems && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {item.subItems.map(si => (
                    <div key={si.id} className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 flex items-center justify-between">
                      <div>
                        <p className="font-headline font-black text-sm">{si.name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant">₦{si.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateSubItemCount(item.id, si.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-container active:scale-90 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-headline font-black text-lg min-w-[1.5ch] text-center">{si.count}</span>
                        <button 
                          onClick={() => updateSubItemCount(item.id, si.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary text-white active:scale-90 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-8">
                {item.services.map(service => (
                  <button 
                    key={service.name}
                    onClick={() => updateService(item.id, service.name)}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-headline font-black text-sm shadow-sm transition-all active:scale-95",
                      item.selectedService === service.name 
                        ? "signature-gradient text-white shadow-lg" 
                        : "bg-white text-on-surface-variant hover:bg-surface-container-highest"
                    )}
                  >
                    {service.name} {service.price > 0 && `(₦${service.price})`}
                  </button>
                ))}
              </div>

              {item.count > 0 && (
                <button 
                  onClick={() => toggleStainRemover(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-6 rounded-3xl border transition-all mb-8",
                    item.hasStainRemover 
                      ? "bg-tertiary-container/20 border-tertiary-container shadow-inner" 
                      : "bg-white border-primary/5 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Sparkles className={cn("w-6 h-6 fill-current", item.hasStainRemover ? "text-tertiary" : "text-on-surface-variant")} />
                    <div className="text-left">
                      <span className="font-headline font-black text-sm block">Stain Remover</span>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Deep cleaning for tough marks</span>
                    </div>
                  </div>
                  <span className={cn("font-label text-sm font-black", item.hasStainRemover ? "text-tertiary" : "text-on-surface-variant")}>
                    {item.hasStainRemover ? 'Added' : 'Add'} +₦{item.stainRemoverPrice}
                  </span>
                </button>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-primary/5">
                <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-label font-bold uppercase tracking-widest">
                    {item.subItems ? 'Custom Set Price' : `Base: ₦${item.basePrice} / ${item.unit}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline font-black text-3xl text-primary">₦{getItemPrice(item).toLocaleString()}</span>
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
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">Cart Summary</p>
                <h3 className="font-headline font-black text-3xl text-on-surface">{totalItems.toString().padStart(2, '0')} Items Selected</h3>
              </div>
              <div className="text-right">
                <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant font-black mb-2">Estimated Total</p>
                <h3 className="font-headline font-black text-5xl text-primary tracking-tighter">₦{totalPrice.toLocaleString()}</h3>
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
                    Pay ₦{totalPrice.toLocaleString()}
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
