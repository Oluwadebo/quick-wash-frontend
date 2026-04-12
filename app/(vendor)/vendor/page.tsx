'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Volume2, Package, CheckCircle, Clock, ArrowRight, Play, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const activeOrders = [
  {
    id: '8821',
    customer: 'Alex Thompson',
    items: '8.5 KG • Express',
    status: 'In Progress',
    time: '2h left',
    color: 'bg-primary-container text-on-primary-container'
  },
  {
    id: '8825',
    customer: 'Tunde Kelani',
    items: '12 KG • Standard',
    status: 'Pending Wash',
    time: '5h left',
    color: 'bg-surface-container-highest text-on-surface'
  }
];

export default function VendorDashboard() {
  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Vendor" showAudioToggle />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Live Dashboard</p>
          </div>
          <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface mb-6 tracking-tighter">
            E káàbọ̀, Campus Cleans!
          </h1>
          <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl border border-primary/5">
            <Volume2 className="text-primary w-6 h-6 fill-current" />
            <p className="font-headline font-bold text-lg text-on-surface">&quot;Ẹ kú iṣẹ́ o! Àwọn aṣọ tuntun ti dé.&quot;</p>
            <button className="ml-auto bg-primary/10 p-2 rounded-full text-primary hover:bg-primary/20 transition-colors">
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Today&apos;s Earnings</p>
            <h3 className="text-4xl font-headline font-black text-on-surface mb-4">₦42,500</h3>
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>+12% from yesterday</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Active Orders</p>
            <h3 className="text-4xl font-headline font-black text-on-surface mb-4">08</h3>
            <div className="flex items-center gap-2 text-on-surface-variant font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>Avg. turnaround: 4.2h</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-primary/5">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Rating</p>
            <h3 className="text-4xl font-headline font-black text-on-surface mb-4">4.9</h3>
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
            {activeOrders.map((order, idx) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 border border-primary/5"
              >
                <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                  <Package className="text-primary w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h4 className="text-xl font-headline font-black text-on-surface">{order.customer}</h4>
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
                <button className="signature-gradient text-white px-8 py-4 rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform w-full md:w-auto">
                  Update Status
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
              <CheckCircle className="text-primary w-10 h-10" />
            </div>
            <h3 className="text-2xl font-headline font-black">Ready for Pickup?</h3>
            <p className="text-on-surface-variant font-medium max-w-xs">Notify the rider that the laundry is clean and ready for delivery.</p>
            <button className="signature-gradient text-white px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full">
              I&apos;M READY FOR PICKUP
            </button>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-tertiary/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-tertiary/5 flex items-center justify-center">
              <Volume2 className="text-tertiary w-10 h-10 fill-current" />
            </div>
            <h3 className="text-2xl font-headline font-black">Report Rain</h3>
            <p className="text-on-surface-variant font-medium max-w-xs">Notify all active customers that drying might be delayed due to weather.</p>
            <button className="bg-tertiary text-on-tertiary px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full">
              REPORT RAIN 🌧️
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
