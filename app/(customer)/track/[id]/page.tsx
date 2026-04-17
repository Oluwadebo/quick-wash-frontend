'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import SealedBagUploader from '@/components/shared/SealedBagUploader';
import ReadyToReceiveButton from '@/components/shared/ReadyToReceiveButton';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShoppingBag, WashingMachine, CheckCircle, MessageCircle, Shield, Package, DoorOpen, Info, Phone, Copy, CreditCard, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from '@/lib/time';

import { Toast } from '@/components/shared/Toast';
import { db, Order, UserData } from '@/lib/DatabaseService';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [rider, setRider] = React.useState<UserData | null>(null);

  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [handoverInput, setHandoverInput] = React.useState('');

  React.useEffect(() => {
    const refresh = async () => {
      const allOrders = await db.getOrders();
      const userData = localStorage.getItem('qw_user');
      const currentUser = userData ? JSON.parse(userData) : {};
      const found = allOrders.find((o: Order) => o.id === resolvedParams.id);
      
      // STRICT UID FILTERING
      if (found && found.customerUid !== currentUser.uid) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(found || null);
      
      if (found?.riderUid) {
        const riderInfo = await db.getUser(found.riderUid);
        setRider(riderInfo);
      }
      setLoading(false);
    };

    refresh();
    window.addEventListener('storage', refresh);
    const interval = setInterval(refresh, 5000); 
    return () => {
      window.removeEventListener('storage', refresh);
      clearInterval(interval);
    };
  }, [resolvedParams.id]);

  if (loading) return <div className="pt-32 text-center font-headline font-black text-on-surface">Loading...</div>;
  if (!order) return <div className="pt-32 text-center font-headline font-black text-on-surface">Order not found.</div>;

  const handleWhatsApp = () => {
    const phone = rider?.phoneNumber || rider?.whatsappNumber || '08012345678';
    const msg = encodeURIComponent(`Hello, I am checking on my Quick-Wash order #${order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCancelOrder = async () => {
    if (order?.status === 'confirm' || order?.status === 'rider_assign_pickup') {
      if (confirm('Are you sure you want to cancel this order? Your payment will be fully refunded to your wallet.')) {
        const updatedOrder = { ...order, status: 'Cancelled', color: 'bg-error/10 text-error', refunded: true };
        await db.saveOrder(updatedOrder);
        
        // Refund customer
        const customer = await db.getUser(order.customerUid);
        if (customer) {
          // Full refund, no trust point penalty if before pickup as requested
          await db.updateUser(customer.uid, { 
            walletBalance: (customer.walletBalance || 0) + (order.totalPrice || 0) 
          });
          
          await db.recordTransaction(customer.uid, {
            type: 'deposit',
            amount: order.totalPrice,
            desc: 'Order Cancellation Refund (Full)'
          });
        }

        setOrder(updatedOrder);
        setNotification({ message: 'Order cancelled and fully refunded successfully.', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      setNotification({ message: 'Orders can only be cancelled before pickup.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const steps = [
    { id: 'confirm', label: 'Paid', icon: CreditCard },
    { id: 'rider_assign_pickup', label: 'Heading', icon: Phone },
    { id: 'picked_up', label: 'Laundry', icon: Package },
    { id: 'washing', label: 'Washing', icon: WashingMachine },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
    { id: 'rider_assign_delivery', label: 'Heading', icon: ArrowRight },
    { id: 'picked_up_delivery', label: 'Delivering', icon: ShoppingBag },
    { id: 'delivered', label: 'Arrived', icon: DoorOpen },
    { id: 'completed', label: 'Done', icon: ShieldCheck }
  ];

  const currentStepIdx = steps.findIndex(s => s.id === order.status);
  const progress = ((currentStepIdx + 1) / steps.length) * 100;

  const handleVerifyDelivery = async (inputCode: string) => {
    if (inputCode === order?.code4) {
      const updatedOrder = { 
        ...order, 
        status: 'delivered', 
        color: 'bg-success text-on-success',
        deliveredAt: new Date().toISOString()
      };
      await db.saveOrder(updatedOrder);
      
      // Rider gets second half of rider fee
      const riderFee = order.riderFee || 1000;
      const secondHalf = riderFee * 0.5;
      
      if (order.riderUid) {
        const riderUser = await db.getUser(order.riderUid);
        if (riderUser) {
          await db.adjustTrustPoints(riderUser.uid, 'completed_order');
          await db.updateUser(riderUser.uid, { 
            walletBalance: (riderUser.walletBalance || 0) + secondHalf 
          });
          await db.recordTransaction(riderUser.uid, {
            type: 'deposit',
            amount: secondHalf,
            desc: `Delivery Fee (2nd Half) - Order #${order.id}`
          });
        }
      }

      setOrder(updatedOrder);
      setNotification({ message: 'Delivery verified! Thank you.', type: 'success' });
      setHandoverInput('');
      
      // Customer reward for successful completion
      if (order.customerUid) await db.adjustTrustPoints(order.customerUid, 'completed_order');

      setTimeout(() => setNotification(null), 3000);
      window.dispatchEvent(new Event('storage'));
    } else {
      setNotification({ message: 'Incorrect delivery code! Please check with the rider.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleNoIssue = async () => {
    if (!order) return;
    const updatedOrder = { 
      ...order, 
      status: 'completed', 
      color: 'bg-success text-on-success',
      completedAt: new Date().toISOString()
    };
    await db.saveOrder(updatedOrder);

    // Vendor gets remaining 20%
    const itemsPrice = order.itemsPrice || 0;
    const remaining20 = itemsPrice * 0.2;
    
    const vendorUser = await db.getUser(order.vendorId);
    if (vendorUser) {
      await db.adjustTrustPoints(vendorUser.uid, 'completed_order');
      await db.updateUser(vendorUser.uid, { 
        walletBalance: (vendorUser.walletBalance || 0) + remaining20,
        pendingBalance: Math.max(0, (vendorUser.pendingBalance || 0) - remaining20)
      });
      await db.recordTransaction(vendorUser.uid, {
        type: 'deposit',
        amount: remaining20,
        desc: `Final Payout (20%) - Order #${order.id}`
      });
    }

    setOrder(updatedOrder);
    setNotification({ message: 'Thank you for confirming! Your order is now completed.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleRaiseIssue = async () => {
    const issue = prompt('Please describe the issue with your order:');
    if (issue && order) {
      const updatedOrder = { 
        ...order, 
        status: 'disputed', 
        color: 'bg-error text-on-error',
        issueDescription: issue,
        disputedAt: new Date().toISOString()
      };
      await db.saveOrder(updatedOrder);
      setOrder(updatedOrder);
      setNotification({ message: 'Your issue has been reported. Our support team will contact you shortly.', type: 'info' });
      setTimeout(() => setNotification(null), 3000);
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
        <AnimatePresence>
          {notification && (
            <Toast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
            />
          )}
        </AnimatePresence>
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
                    {step.icon ? <step.icon className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 fill-current" />}
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
        {(order.status === 'rider_assign_pickup' || order.status === 'picked_up_delivery') && (
          <section className="bg-surface-container-lowest rounded-[3rem] p-10 text-center space-y-8 shadow-2xl border-4 border-primary-container relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck className="text-primary/10 w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <p className="font-label text-xs uppercase tracking-[0.3em] font-black text-on-surface-variant mb-8">
                {order.status === 'rider_assign_pickup' ? 'Give this to Rider at Pickup' : 'Enter Code from Rider to Confirm Delivery'}
              </p>
              
              {order.status === 'rider_assign_pickup' ? (
                <div className="flex justify-center gap-4">
                  {(order.code1 || '----').split('').map((num: string, i: number) => (
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
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <input 
                    type="text" 
                    placeholder="Enter Code 4"
                    maxLength={4}
                    value={handoverInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setHandoverInput(val);
                      if (val.length === 4) {
                        handleVerifyDelivery(val);
                      }
                    }}
                    className="w-48 h-20 bg-surface-container-low rounded-2xl text-center text-4xl font-headline font-black text-primary shadow-xl border-2 border-primary/20 outline-none focus:border-primary transition-all"
                  />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">ASK RIDER FOR CODE 4 TO CONFIRM DELIVERY</p>
                </div>
              )}

              <div className="mt-10 flex items-center justify-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <Info className="text-primary w-5 h-5" />
                <p className="text-xs font-bold text-on-surface-variant leading-relaxed text-center">
                  {order.status === 'rider_assign_pickup' 
                    ? 'The rider needs this code to confirm they have picked up your laundry.'
                    : 'The rider has a code for you. Enter it here only after you have received and inspected your laundry.'}
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
        {(order.status === 'confirm' || order.status === 'rider_assign_pickup') && (
          <div className="mt-8">
            <button 
              onClick={handleCancelOrder}
              className="w-full h-16 bg-error text-white rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform shadow-xl shadow-error/20 flex items-center justify-center gap-3"
            >
              <AlertTriangle className="w-5 h-5" />
              CANCEL ORDER & REFUND
            </button>
            <p className="text-center text-[10px] font-bold text-error uppercase tracking-widest mt-3 opacity-60">
              Full refund to wallet before rider pickup
            </p>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      {order.status === 'ready' && (
        <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-surface via-surface to-transparent z-40">
          <div className="max-w-2xl mx-auto">
            <ReadyToReceiveButton 
              onClick={async () => {
                if (!order) return;
                const updatedOrder = { 
                  ...order, 
                  status: 'rider_assign_delivery', 
                  color: 'bg-primary text-on-primary',
                  customerConfirmedDeliveryAt: new Date().toISOString()
                };
                await db.saveOrder(updatedOrder);
                setOrder(updatedOrder);
                setNotification({ message: 'Riders have been notified that you are ready to receive your laundry!', type: 'success' });
                setTimeout(() => setNotification(null), 3000);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
