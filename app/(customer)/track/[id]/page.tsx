'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import SealedBagUploader from '@/components/shared/SealedBagUploader';
import ReadyToReceiveButton from '@/components/shared/ReadyToReceiveButton';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShoppingBag, WashingMachine, CheckCircle, MessageCircle, Shield, Package, DoorOpen, Info, Phone, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from '@/lib/time';

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
      setRider(riderInfo || { fullName: found.riderName, phoneNumber: found.riderPhone });
    }
    setLoading(false);
  }, [resolvedParams.id]);

  if (loading) return <div className="pt-32 text-center font-headline font-black">Loading...</div>;
  if (!order) return <div className="pt-32 text-center font-headline font-black">Order not found.</div>;

  const handleWhatsApp = () => {
    const phone = rider?.phoneNumber || rider?.whatsappNumber || '08012345678';
    const msg = encodeURIComponent(`Hello, I am checking on my Quick-Wash order #${order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCancelOrder = () => {
    if (order?.status === 'confirm' || order?.status === 'rider_assign_pickup') {
      if (confirm('Are you sure you want to cancel this order?')) {
        const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
        const updated = allOrders.map((o: any) => o.id === order.id ? { ...o, status: 'Cancelled', color: 'bg-error/10 text-error' } : o);
        localStorage.setItem('qw_orders', JSON.stringify(updated));
        setOrder({ ...order, status: 'Cancelled', color: 'bg-error/10 text-error' });
        alert('Order cancelled successfully.');
      }
    } else {
      alert('Orders can only be cancelled before pickup.');
    }
  };

  const steps = [
    { id: 'confirm', label: 'Confirmed' },
    { id: 'rider_assign_pickup', label: 'Pickup' },
    { id: 'picked_up', label: 'Picked up' },
    { id: 'washing', label: 'Washing' },
    { id: 'ready', label: 'Ready' },
    { id: 'rider_assign_delivery', label: 'Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' }
  ];

  const currentStepIdx = steps.findIndex(s => s.id === order.status);
  const progress = ((currentStepIdx + 1) / steps.length) * 100;

  const handleNoIssue = () => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === order.id) {
        return { 
          ...o, 
          status: 'completed', 
          color: 'bg-success text-on-success',
          completedAt: new Date().toISOString()
        };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setOrder(updated.find((o: any) => o.id === order.id));
    alert('Thank you for confirming! Your order is now completed.');
  };

  const handleRaiseIssue = () => {
    const issue = prompt('Please describe the issue with your order:');
    if (issue) {
      const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
      const updated = allOrders.map((o: any) => {
        if (o.id === order.id) {
          return { 
            ...o, 
            status: 'disputed', 
            color: 'bg-error text-on-error',
            issueDescription: issue,
            disputedAt: new Date().toISOString()
          };
        }
        return o;
      });
      localStorage.setItem('qw_orders', JSON.stringify(updated));
      setOrder(updated.find((o: any) => o.id === order.id));
      alert('Your issue has been reported. Our support team will contact you shortly.');
    }
  };

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
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{formatRelativeTime(order.time)} • {order.status}</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-surface-container-highest relative border-2 border-primary-container shadow-lg">
            <Image 
              src={`https://picsum.photos/seed/${order.customerPhone}/100/100`} 
              alt="Profile"
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
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant",
                    isCurrent && "ring-4 ring-primary-container shadow-xl"
                  )}>
                    <CheckCircle className="w-5 h-5 fill-current" />
                  </div>
                  <span className={cn(
                    "font-headline text-[8px] font-black uppercase tracking-widest text-center",
                    isActive ? "text-primary" : "text-on-surface-variant"
                  )}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Handover Code Section */}
        {['rider_assign_pickup', 'rider_assign_delivery', 'ready'].includes(order.status) && (
          <section className="bg-surface-container-lowest rounded-[3rem] p-10 text-center space-y-8 shadow-2xl border-4 border-primary-container relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck className="text-primary/10 w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <p className="font-label text-xs uppercase tracking-[0.3em] font-black text-on-surface-variant mb-8">
                {order.status === 'rider_assign_pickup' ? 'Give this to Rider at Pickup' : 'Your Handover Code'}
              </p>
              <div className="flex justify-center gap-4">
                {((order.status === 'rider_assign_pickup' ? order.pickupCode : order.handoverCode) || '----').split('').map((num: string, i: number) => (
                  <motion.span 
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-16 h-20 flex items-center justify-center bg-surface-container-low rounded-2xl text-4xl font-headline font-black text-primary shadow-xl border border-primary/5"
                  >
                    {num}
                  </motion.span>
                ))}
              </div>
              <div className="mt-10 flex items-center justify-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <Info className="text-primary w-5 h-5" />
                <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                  {order.status === 'rider_assign_pickup' 
                    ? 'The rider needs this code to confirm they have picked up your laundry.'
                    : 'Show this code to the rider only after receiving your laundry.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Sealed Bag Uploader - Only at pickup stage */}
        {(order.status === 'confirm' || order.status === 'rider_assign_pickup') && (
          <SealedBagUploader />
        )}

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
          {rider && (
            <div className="flex gap-2">
              <button 
                onClick={() => window.open(`tel:${rider.phoneNumber}`)}
                className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(rider.phoneNumber);
                  alert('Phone number copied!');
                }}
                className="w-12 h-12 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center active:scale-90 transition-transform"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button 
                onClick={handleWhatsApp}
                className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <MessageCircle className="w-6 h-6 fill-current" />
              </button>
            </div>
          )}
        </section>

        {/* Protection Info */}
        <section className="bg-tertiary-container/10 rounded-[2.5rem] p-8 border border-tertiary-container/30">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="text-tertiary w-6 h-6 fill-current" />
            <span className="font-headline font-black text-lg text-tertiary">24hr Protection Active – 20% held</span>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            Payment of ₦{(order.totalPrice || 0).toLocaleString()} is held securely. 20% (₦{(order.totalPrice * 0.2 || 0).toLocaleString()}) is held for 24 hours after delivery to ensure your satisfaction.
          </p>
          
          {order.status === 'delivered' && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button 
                onClick={handleRaiseIssue}
                className="h-16 rounded-2xl bg-error/10 text-error font-headline font-black text-xs active:scale-95 transition-transform"
              >
                RAISE ISSUE
              </button>
              <button 
                onClick={handleNoIssue}
                className="h-16 rounded-2xl bg-success text-white font-headline font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                NO ISSUE
              </button>
            </div>
          )}
        </section>

        {/* Cancel Button */}
        {(order.status === 'Awaiting Pickup Confirmation' || order.status === 'Pending Pickup') && (
          <button 
            onClick={handleCancelOrder}
            className="w-full h-16 bg-error/10 text-error rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
          >
            CANCEL ORDER
          </button>
        )}
      </main>

      {/* Sticky Footer */}
      {order.status === 'ready' && (
        <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-surface via-surface to-transparent z-40">
          <div className="max-w-2xl mx-auto">
            <ReadyToReceiveButton 
              onClick={() => {
                const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
                const updated = allOrders.map((o: any) => {
                  if (o.id === resolvedParams.id) {
                    return { 
                      ...o, 
                      status: 'rider_assign_delivery', 
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
