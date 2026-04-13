'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import SealedBagUploader from '@/components/shared/SealedBagUploader';
import ReadyToReceiveButton from '@/components/shared/ReadyToReceiveButton';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShoppingBag, WashingMachine, CheckCircle, MessageCircle, Shield, Package, DoorOpen, Info } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const [rider, setRider] = React.useState<any>(null);

  React.useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const found = allOrders.find((o: any) => o.id === resolvedParams.id);
    setOrder(found);
    
    if (found?.riderPhone) {
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const riderInfo = allUsers.find((u: any) => u.phoneNumber === found.riderPhone);
      setRider(riderInfo);
    }
    setLoading(false);
  }, [resolvedParams.id]);

  if (loading) return <div className="pt-32 text-center font-headline font-black">Loading...</div>;
  if (!order) return <div className="pt-32 text-center font-headline font-black">Order not found.</div>;

  const handleWhatsApp = () => {
    const phone = rider?.phoneNumber || '08012345678';
    const msg = encodeURIComponent(`Hello, I am checking on my Quick-Wash order #${order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const steps = [
    { id: 'Picked Up', icon: ShoppingBag, label: 'Picked up' },
    { id: 'Washing', icon: WashingMachine, label: 'Washing' },
    { id: 'Ready for Handover', icon: CheckCircle, label: 'Handover' },
    { id: 'Handover', icon: DoorOpen, label: 'Delivered' }
  ];

  const currentStepIdx = steps.findIndex(s => s.id === order.status);
  const progress = ((currentStepIdx + 1) / steps.length) * 100;

  return (
    <div className="pb-64">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b-2 border-primary/10">
        <div className="flex justify-between items-center px-6 h-20 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/track" className="hover:opacity-80 transition-opacity active:scale-95 text-on-surface bg-surface-container-low p-3 rounded-2xl">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-on-surface font-black font-headline text-xl tracking-tight leading-tight">Order #{order.id}</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{order.status}</p>
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
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary"
              />
            </div>
            
            {steps.map((step, i) => {
              const isActive = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant",
                    isCurrent && "ring-8 ring-primary-container shadow-xl"
                  )}>
                    <step.icon className="w-7 h-7 fill-current" />
                  </div>
                  <span className={cn(
                    "font-headline text-[10px] font-black uppercase tracking-widest text-center",
                    isActive ? "text-primary" : "text-on-surface-variant"
                  )}>{step.label}</span>
                </div>
              );
            })}
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
              {(order.handoverCode || '----').split('').map((num: string, i: number) => (
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
              src={`https://picsum.photos/seed/${rider?.phoneNumber || 'rider'}/100/100`} 
              alt="Rider"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-xl text-on-surface">{rider?.fullName || 'Assigning Rider...'}</h4>
            <p className="font-label text-[10px] uppercase font-black tracking-widest text-on-surface-variant">
              {rider ? `Elite Rider • ID: ${rider.phoneNumber.slice(-4)}` : 'Admin is assigning a rider'}
            </p>
          </div>
          <button 
            onClick={handleWhatsApp}
            className="w-16 h-16 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          >
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
            Payment of ₦{order.totalPrice.toLocaleString()} is held securely. You have 48 hours after delivery to report any issues before the rider is paid.
          </p>
        </section>
      </main>

      {/* Sticky Footer */}
      {order.status === 'Awaiting Delivery Confirmation' && (
        <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-surface via-surface to-transparent z-40">
          <div className="max-w-2xl mx-auto">
            <ReadyToReceiveButton 
              onClick={() => {
                const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
                const updated = allOrders.map((o: any) => {
                  if (o.id === resolvedParams.id) {
                    return { 
                      ...o, 
                      status: 'Ready for Delivery', 
                      color: 'bg-primary text-on-primary',
                      customerConfirmedDeliveryAt: new Date().toISOString()
                    };
                  }
                  return o;
                });
                localStorage.setItem('qw_orders', JSON.stringify(updated));
                setOrder(updated.find((o: any) => o.id === resolvedParams.id));
                alert('Riders have been notified that you are ready to receive your laundry!');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
