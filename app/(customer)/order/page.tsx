'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import ReadyForPickupButton from '@/components/shared/ReadyForPickupButton';
import { Minus, Plus, Sparkles, Shirt, ShoppingBag, Bed, CreditCard, Bolt, Info, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const items = [
  {
    id: 'shirts',
    name: 'Shirts & Tops',
    desc: 'Daily Essentials • Aṣọ Òkè',
    icon: Shirt,
    price: 200,
    unit: 'unit',
    count: 4,
    services: ['Wash', 'Iron', 'Wash + Iron'],
    selectedService: 'Wash'
  },
  {
    id: 'trousers',
    name: 'Trousers',
    desc: 'Denim & Chinos • Òkòtò',
    icon: ShoppingBag,
    price: 250,
    unit: 'unit',
    count: 2,
    services: ['Wash', 'Iron', 'Wash + Iron'],
    selectedService: 'Wash + Iron'
  },
  {
    id: 'beddings',
    name: 'Beddings',
    desc: 'Sheets & Covers • Aṣọ Ìbùsùn',
    icon: Bed,
    price: 1200,
    unit: 'set',
    count: 1,
    services: ['Wash', 'Steam Press'],
    selectedService: 'Wash',
    addOn: { name: 'Stain Remover Added', price: 500 }
  }
];

export default function OrderPage() {
  const [cart, setCart] = React.useState(items);

  const updateCount = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item
    ));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.count, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.count * item.price) + (item.count > 0 && item.addOn ? item.addOn.price : 0), 0);

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
            Ẹ jẹ́ kí á bẹ̀rẹ̀.
          </h1>
          <p className="text-on-surface-variant font-medium text-xl leading-relaxed max-w-xl">
            What are we cleaning today? Select your items and how you want them handled.
          </p>
        </header>

        {/* Special Offers / Info */}
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
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {item.services.map(service => (
                  <button 
                    key={service}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-headline font-black text-sm shadow-sm transition-all active:scale-95",
                      item.selectedService === service 
                        ? "signature-gradient text-white shadow-lg" 
                        : "bg-white text-on-surface-variant hover:bg-surface-container-highest"
                    )}
                  >
                    {service}
                  </button>
                ))}
              </div>

              {item.addOn && item.count > 0 && (
                <div className="flex items-center justify-between p-6 bg-tertiary-container/10 rounded-3xl border border-tertiary-container/30 mb-8">
                  <div className="flex items-center gap-4">
                    <Sparkles className="text-tertiary w-6 h-6 fill-current" />
                    <div>
                      <span className="font-headline font-black text-sm block">{item.addOn.name}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Applied to all {item.name}</span>
                    </div>
                  </div>
                  <span className="font-label text-sm font-black text-tertiary">+₦{item.addOn.price}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-primary/5">
                <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-label font-bold uppercase tracking-widest">₦{item.price} / {item.unit}</span>
                </div>
                <div className="text-right">
                  <span className="font-headline font-black text-3xl text-primary">₦{(item.count * item.price + (item.count > 0 && item.addOn ? item.addOn.price : 0)).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Sticky Footer with Ready Button */}
      <footer className="fixed bottom-0 left-0 w-full z-50">
        <div className="bg-white/95 backdrop-blur-3xl rounded-t-[3rem] px-8 pt-10 pb-12 shadow-[0_-20px_60px_rgba(0,106,40,0.15)] border-t border-primary/5">
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
            
            <ReadyForPickupButton />

            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 text-[10px] font-label font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-40">
                <ShieldCheck className="w-3 h-3" />
                Gbogbo aṣọ rẹ yoo jẹ mímọ́
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
