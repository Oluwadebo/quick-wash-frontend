'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import SealedBagUploader from '@/components/shared/SealedBagUploader';
import ReadyToReceiveButton from '@/components/shared/ReadyToReceiveButton';
import { ArrowLeft, ShieldCheck, ShoppingBag, WashingMachine, CheckCircle, MessageCircle, Shield, Package, DoorOpen, Info } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  
  return (
    <div className="pb-64">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl shadow-sm">
        <div className="flex justify-between items-center px-6 h-20 w-full">
          <div className="flex items-center gap-4">
            <button className="hover:opacity-80 transition-opacity active:scale-95 text-on-surface bg-surface-container-low p-3 rounded-2xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-on-surface font-black font-headline text-xl tracking-tight leading-tight">Order #{resolvedParams.id || '4821'}</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ready for Handover</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-surface-container-highest relative border-2 border-primary-container shadow-lg">
            <Image 
              src="https://picsum.photos/seed/student/100/100" 
              alt="Student Profile"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8">
        {/* Status Progress */}
        <section className="bg-surface-container-low rounded-[3rem] p-10 shadow-sm border border-primary/5">
          <div className="flex justify-between items-start relative">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[80%] h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-full bg-primary"
              />
            </div>
            
            {[
              { icon: ShoppingBag, label: 'Picked up' },
              { icon: WashingMachine, label: 'Washing' },
              { icon: CheckCircle, label: 'Handover', active: true }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500",
                  step.active ? "bg-primary text-on-primary ring-8 ring-primary-container shadow-xl" : "bg-primary text-on-primary"
                )}>
                  <step.icon className="w-7 h-7 fill-current" />
                </div>
                <span className={cn(
                  "font-headline text-[10px] font-black uppercase tracking-widest text-center",
                  step.active ? "text-primary" : "text-on-surface-variant"
                )}>{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Handover Code Section */}
        <section className="bg-surface-container-lowest rounded-[3rem] p-10 text-center space-y-8 shadow-2xl border-4 border-primary-container relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <ShieldCheck className="text-primary/10 w-24 h-24" />
          </div>
          
          <div className="relative z-10">
            <p className="font-label text-xs uppercase tracking-[0.3em] font-black text-on-surface-variant mb-8">Your Handover Code</p>
            <div className="flex justify-center gap-4">
              {['4', '8', '2', '1'].map((num, i) => (
                <motion.span 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-20 h-24 flex items-center justify-center bg-surface-container-low rounded-3xl text-5xl font-headline font-black text-primary shadow-xl border border-primary/5"
                >
                  {num}
                </motion.span>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <Info className="text-primary w-5 h-5" />
              <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                Show this code to the rider only after receiving your laundry.
              </p>
            </div>
          </div>
        </section>

        {/* Sealed Bag Uploader */}
        <SealedBagUploader />

        {/* Rider Info */}
        <section className="bg-surface-container-low rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm border border-primary/5">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-surface-variant ring-4 ring-white relative shadow-xl">
            <Image 
              src="https://picsum.photos/seed/rider/100/100" 
              alt="Rider"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-xl text-on-surface">Samuel Okon</h4>
            <p className="font-label text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Elite Rider • ID: QW-902</p>
          </div>
          <button className="w-16 h-16 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform">
            <MessageCircle className="w-8 h-8 fill-current" />
          </button>
        </section>

        {/* Protection Info */}
        <section className="bg-tertiary-container/10 rounded-[2.5rem] p-8 border border-tertiary-container/30">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="text-tertiary w-6 h-6 fill-current" />
            <span className="font-headline font-black text-lg text-tertiary">48hr Protection Active</span>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            Payment of ₦4,350 is held securely. You have 48 hours after delivery to report any issues before the rider is paid.
          </p>
        </section>
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-surface via-surface to-transparent z-40">
        <div className="max-w-2xl mx-auto">
          <ReadyToReceiveButton />
        </div>
      </div>
    </div>
  );
}
