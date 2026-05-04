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
import { api, Order, UserData } from '@/lib/ApiService';

import { useAuth } from '@/hooks/use-auth';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { user: authUser } = useAuth();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [rider, setRider] = React.useState<UserData | null>(null);

  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [handoverInput, setHandoverInput] = React.useState('');
  const [showIssueInput, setShowIssueInput] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [issueDescription, setIssueDescription] = React.useState('');

  React.useEffect(() => {
    const refresh = async () => {
      if (!authUser?.uid) return;

      const found = await api.getOrder(resolvedParams.id);
      
      // STRICT UID FILTERING
      if (found && found.customerUid !== authUser.uid) {
        setOrder(null);
        setLoading(false);
        return;
      }

      if (found) setOrder(found);
      
      if (found?.riderUid) {
        const riderInfo = await api.getUser(found.riderUid);
        setRider(riderInfo);
      }
      setLoading(false);
    };

    refresh();
    const interval = setInterval(refresh, 5000); 
    return () => clearInterval(interval);
  }, [resolvedParams.id, authUser]);

  if (loading) return <div className="pt-32 text-center font-headline font-black text-on-surface">Loading Dashboard...</div>;
  if (!order) return <div className="pt-32 text-center font-headline font-black text-on-surface">Order not found.</div>;

  const handleWhatsApp = () => {
    const phone = rider?.phoneNumber || rider?.whatsappNumber || '08012345678';
    const msg = encodeURIComponent(`Hello, I am checking on my Quick-Wash order #${order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCancelOrder = async () => {
    if (order?.status === 'confirm' || order?.status === 'rider_assign_pickup' || order?.status === 'rider_accepted') {
      try {
        const token = localStorage.getItem('qw_token');
        const res = await fetch(`/api/orders/${order.id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: 'User Cancelled via Dashboard' })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to cancel order');
        }

        const data = await res.json();
        setOrder(data.order);
        setNotification({ message: 'Order successfully cancelled and fully refunded to your wallet.', type: 'success' });
        setShowCancelModal(false);
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => setNotification(null), 4000);
      } catch (error: any) {
        console.error("Cancellation error:", error);
        setNotification({ message: error.message || "Could not cancel order at this time.", type: 'error' });
        setShowCancelModal(false);
        setTimeout(() => setNotification(null), 4000);
      }
    } else {
      setNotification({ message: 'Sorry, orders can only be cancelled before pickup.', type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const steps = [
    { id: 'confirm', label: 'Paid', icon: CreditCard },
    { id: 'rider_assign_pickup', label: order.riderUid ? 'Heading' : 'Searching', icon: Phone },
    { id: 'picked_up', label: 'Laundry', icon: Package },
    { id: 'washing', label: 'Washing', icon: WashingMachine },
    { id: 'ready', label: 'Finished', icon: CheckCircle },
    { id: 'rider_assign_delivery', label: order.riderUid ? 'Coming' : 'Searching', icon: ArrowRight },
    { id: 'picked_up_delivery', label: 'Delivering', icon: ShoppingBag },
    { id: 'delivered', label: 'Arrived', icon: DoorOpen },
    { id: 'completed', label: 'Done', icon: ShieldCheck }
  ];

  const getStatusMessage = () => {
    switch (order.status) {
      case 'confirm': return "Order confirmed! Waiting for a rider to pick up your laundry.";
      case 'rider_assign_pickup': return order.riderUid ? "Rider is on the way to pick up your laundry." : "Searching for a rider nearby...";
      case 'picked_up': return "Laundry picked up! Heading to the vendor station.";
      case 'washing': return "Vendor is currently washing your clothes. Stay fresh!";
      case 'ready': return "Wash Complete! Your clothes are ready. Click 'I AM READY' below so a rider can pick them up.";
      case 'rider_assign_delivery': return "Rider has been notified! Searching for a rider to deliver your clean clothes.";
      case 'picked_up_delivery': return "Rider has picked up your clean clothes and is heading to you!";
      case 'delivered': return "Your laundry has arrived! Please inspect and confirm.";
      case 'completed': return "Order successfully completed. Thank you!";
      default: return "Processing your order...";
    }
  };

  const currentStepIdx = steps.findIndex(s => s.id === order.status);
  const progress = ((currentStepIdx + 1) / steps.length) * 100;

  const handleVerifyDelivery = async (inputCode: string) => {
    try {
      const updatedOrder = await api.updateOrderStatus(order.id, 'delivered', 'bg-success text-on-success', inputCode);
      setOrder(updatedOrder);
      setNotification({ message: 'Delivery verified! Thank you.', type: 'success' });
      setHandoverInput('');
      
      // Customer reward for successful completion
      if (order.customerUid) await api.adjustTrustPoints(order.customerUid, 'completed_order');

      setTimeout(() => setNotification(null), 3000);
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      setNotification({ message: error.message || 'Incorrect delivery code!', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleNoIssue = async () => {
    if (!order) return;
    try {
      const updatedOrder = await api.updateOrderStatus(order.id, 'completed', 'bg-success text-on-success');
      setOrder(updatedOrder);
      setShowRatingModal(true);
      setNotification({ message: 'Thank you for confirming! Please rate your experience.', type: 'success' });
      
      // Customer reward for successful completion
      if (order.customerUid) await api.adjustTrustPoints(order.customerUid, 'completed_order');
      
      // Also reward vendor
      if (order.vendorId) await api.adjustTrustPoints(order.vendorId, 'completed_order');

      setTimeout(() => setNotification(null), 3000);
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      setNotification({ message: error.message || 'Failed to complete order', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSubmitRating = async () => {
    if (!order) return;
    
    // Adjust vendor trust points based on rating
    // 5 stars = +5, 4 stars = +2, 3 stars = 0, 2 stars = -5, 1 star = -10
    const pointsMap: { [key: number]: number } = { 5: 5, 4: 2, 3: 0, 2: -5, 1: -10 };
    await api.adjustTrustPoints(order.vendorId, pointsMap[rating] || 0);
    
    setShowRatingModal(false);
    setNotification({ message: 'Thank you for your feedback!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRaiseIssue = async () => {
    if (!issueDescription.trim() || !order) return;
    
    const updatedOrder = { 
      ...order, 
      status: 'disputed', 
      color: 'bg-error text-on-error',
      issueDescription: issueDescription,
      disputedAt: new Date().toISOString()
    } as Order;

    await api.saveOrder(updatedOrder);
    setOrder(updatedOrder);
    setShowIssueInput(false);
    setNotification({ message: 'Your issue has been reported. Our support team will contact you shortly.', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
    window.dispatchEvent(new Event('storage'));
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

      <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8 pb-40">
        <AnimatePresence>
          {notification && (
            <Toast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
            />
          )}
        </AnimatePresence>

        {/* Status Message Card */}
        <section className="bg-primary shadow-2xl shadow-primary/20 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Current Status</p>
            <h2 className="text-2xl font-headline font-black leading-tight tracking-tight">
              {getStatusMessage()}
            </h2>
          </div>
        </section>

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
        {(order.status === 'confirm' || order.status === 'rider_assign_pickup' || order.status === 'rider_accepted' || order.status === 'washing' || order.status === 'ready' || order.status === 'rider_assign_delivery' || order.status === 'picked_up_delivery') && (
          <section className="bg-surface-container-lowest rounded-[3rem] p-10 text-center space-y-8 shadow-2xl border-4 border-primary-container relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck className="text-primary/10 w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <p className="font-label text-xs uppercase tracking-[0.3em] font-black text-on-surface-variant mb-8">
                {order.status === 'picked_up_delivery' ? 'Enter Code from Rider to Confirm Delivery' : 'Your Handoff Code for the Rider'}
              </p>
              
              {(order.status !== 'picked_up_delivery') ? (
                <div className="flex flex-col items-center">
                  <div className="flex justify-center gap-4 mb-4">
                    {(order.code1 || '----').split('').map((num: string, i: number) => (
                      <motion.span 
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-14 h-16 sm:w-16 sm:h-20 flex items-center justify-center bg-surface-container-low rounded-2xl text-3xl sm:text-4xl font-headline font-black text-primary shadow-xl border border-primary/5"
                      >
                        {num}
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">PICKUP CODE (GIVE TO RIDER)</p>
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
          <SealedBagUploader 
            orderId={order.id} 
            onUploaded={async () => {
              const all = await api.getOrders();
              const fresh = all.find((o: Order) => o.id === order.id);
              if (fresh) setOrder(fresh);
            }} 
          />
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
                  setNotification({ message: 'Phone number copied to clipboard', type: 'info' });
                  setTimeout(() => setNotification(null), 2000);
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
            <div className="mt-8 space-y-4">
              {showIssueInput ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 bg-white p-6 rounded-3xl border-2 border-error/20"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-error">Describe the issue</label>
                  <textarea 
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="e.g. Missing items, damaged clothes, etc."
                    className="w-full h-32 bg-surface-container-low rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-error/20"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowIssueInput(false)}
                      className="flex-1 h-14 rounded-xl bg-surface-container-highest font-headline font-black text-xs"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleRaiseIssue}
                      disabled={!issueDescription.trim()}
                      className="flex-[2] h-14 rounded-xl bg-error text-white font-headline font-black text-xs shadow-lg shadow-error/20 disabled:opacity-50"
                    >
                      SUBMIT REPORT
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowIssueInput(true)}
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
            </div>
          )}
        </section>

        {/* Cancel Button */}
        {(order.status === 'confirm' || order.status === 'rider_assign_pickup' || order.status === 'rider_accepted') && (
          <div className="mt-8">
            <button 
              onClick={() => setShowCancelModal(true)}
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
        {/* Action Button Section */}
        {order.status === 'ready' && (
          <div className="mt-8 mb-4 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm border border-primary/20">
              Tap below when you are ready to receive
            </p>
            <ReadyToReceiveButton 
              onClick={async () => {
                if (!order) return;
                try {
                  const updatedOrder = await api.updateOrderStatus(order.id, 'rider_assign_delivery', 'bg-primary text-on-primary', {
                    customerReadyForDelivery: true,
                    customerConfirmedDeliveryAt: new Date().toISOString(),
                    riderUid: null,
                    riderName: null,
                    riderPhone: null
                  });
                  setOrder(updatedOrder);
                  setNotification({ message: 'Riders have been notified that you are ready to receive your laundry!', type: 'success' });
                  setTimeout(() => setNotification(null), 5000);
                  window.dispatchEvent(new Event('storage'));
                } catch (e: any) {
                  setNotification({ message: e.message || 'Failed to update status', type: 'error' });
                  setTimeout(() => setNotification(null), 3000);
                }
              }}
            />
          </div>
        )}
      </main>
      
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
            onClick={() => setShowCancelModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-surface-container-low rounded-[3rem] p-10 border border-error/20 shadow-2xl text-center max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Cancel Order?</h2>
            <p className="text-on-surface-variant text-sm font-medium mb-8">
              Are you sure? Your payment will be fully refunded to your wallet.
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleCancelOrder}
                className="w-full h-16 bg-error text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
              >
                YES, CANCEL & REFUND
              </button>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="w-full h-16 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
              >
                GO BACK
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
            onClick={() => setShowRatingModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-sm bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl text-center max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Rate Experience</h2>
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-on-surface-variant text-sm font-medium mb-8">How was the laundry service?</p>
                  
                  <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                          rating >= star ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
                        )}
                      >
                        <Shield className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleSubmitRating}
                    className="w-full h-16 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                  >
                    SUBMIT RATING
                  </button>
                </div>
              </motion.div>
        </div>
      )}
    </div>
  );
}
