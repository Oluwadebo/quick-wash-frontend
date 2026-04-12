'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Shirt, ShoppingBag, Bed, Sparkles, Plus, Edit3, Trash2, Check, X, Droplets, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const initialPrices = [
  { id: '1', name: 'Wash & Fold', category: 'Shirts', price: 200, icon: Shirt, color: 'bg-primary-container text-on-primary-container' },
  { id: '2', name: 'Iron Only', category: 'Trousers', price: 150, icon: ShoppingBag, color: 'bg-secondary-container text-on-secondary-container' },
  { id: '3', name: 'Wash + Iron', category: 'Suits', price: 800, icon: Shirt, color: 'bg-tertiary-container text-on-tertiary-container' },
  { id: '4', name: 'Stain Remover', category: 'Add-on', price: 500, icon: Sparkles, color: 'bg-error-container text-on-error-container' },
  { id: '5', name: 'White Clothes Premium', category: 'Special', price: 1200, icon: Zap, color: 'bg-surface-container-highest text-on-surface' },
  { id: '6', name: 'Bed Sheets', category: 'Beddings', price: 1500, icon: Bed, color: 'bg-primary-container text-on-primary-container' },
];

export default function PriceListPage() {
  const [prices, setPrices] = React.useState(initialPrices);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Vendor" showAudioToggle />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <Droplets className="w-6 h-6 fill-current" />
              </div>
              <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Service Management</p>
            </div>
            <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface tracking-tighter">
              My Price List
            </h1>
          </div>
          <button className="signature-gradient text-white px-8 py-5 rounded-2xl font-headline font-black text-sm flex items-center gap-3 shadow-xl active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            Add New Service
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {prices.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl", item.color)}>
                  <item.icon className="w-10 h-10" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingId(item.id)}
                    className="p-3 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">
                  {item.category}
                </span>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-6">{item.name}</h3>
                
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-inner border border-primary/5">
                  <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Price per unit</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-headline font-black text-primary">₦{item.price}</span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {editingId === item.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 z-10 flex flex-col justify-center"
                  >
                    <h4 className="font-headline font-black text-xl mb-6 text-center">Update Price</h4>
                    <div className="relative mb-8">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-headline font-black text-primary">₦</span>
                      <input 
                        type="number" 
                        defaultValue={item.price}
                        className="w-full h-20 bg-surface-container-low rounded-2xl pl-12 pr-6 font-headline font-black text-3xl focus:ring-4 focus:ring-primary-container outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="bg-surface-container-highest py-5 rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <X className="w-5 h-5" />
                        Cancel
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="signature-gradient text-white py-5 rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Check className="w-5 h-5" />
                        Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
