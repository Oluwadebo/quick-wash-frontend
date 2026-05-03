'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { CheckCircle, Volume2, Truck, Package } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopAppBar showClose onClose={() => {}} />
      
      <main className="flex-grow pt-24 pb-32 px-6 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="relative w-full aspect-square max-h-[320px] mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-3xl"></div>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center mb-6 shadow-xl">
              <CheckCircle className="text-on-primary-container w-16 h-16 fill-current" />
            </div>
            <h2 className="font-headline text-[3.5rem] leading-[1.1] font-extrabold text-center tracking-tighter text-on-surface">
              Payment Successful
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-2 bg-surface-container-low rounded-3xl p-6 flex flex-col justify-between"
          >
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Estimated Pickup</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-4xl font-extrabold text-primary">25</span>
              <span className="font-headline text-xl font-bold text-on-surface-variant">Minutes</span>
            </div>
            <p className="font-body text-sm text-on-surface-variant mt-2">Driver is arriving at your campus hostel shortly.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-container-highest/30 rounded-3xl p-6 flex flex-col justify-center"
          >
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Paid</span>
            <span className="font-headline text-2xl font-extrabold text-on-surface">₦4,500</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-surface-container-highest/30 rounded-3xl p-6 flex flex-col justify-center"
          >
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Order ID</span>
            <span className="font-headline text-xl font-bold text-on-surface">#QW-8821</span>
          </motion.div>
        </div>

        <div className="w-full bg-surface-container-low rounded-3xl p-6 mb-12">
          <h3 className="font-headline text-sm font-bold text-on-surface mb-4">Service Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image 
                  src="https://picsum.photos/seed/laundry4/100/100" 
                  alt="Service"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="font-headline font-bold text-on-surface">Express Wash & Fold</p>
                <p className="font-label text-xs text-on-surface-variant">8.5 KG • Campus Premium</p>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent z-40">
          <div className="max-w-lg mx-auto">
            <Link 
              href="/track/8821"
              className="signature-gradient w-full h-[64px] rounded-[1.5rem] flex items-center justify-center gap-3 text-on-primary shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <Truck className="w-6 h-6 fill-current" />
              <span className="font-headline text-lg font-extrabold tracking-tight">Track Order</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
