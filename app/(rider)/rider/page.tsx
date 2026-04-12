'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { MapPin, Navigation, Package, CheckCircle, Clock, Phone, ArrowRight, Bike, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const tasks = [
  {
    id: 'QW-8821',
    type: 'Pickup',
    location: 'Campus Cleans (Under G)',
    customer: 'Alex Thompson',
    time: 'Now',
    priority: true
  },
  {
    id: 'QW-8825',
    type: 'Delivery',
    location: 'North Campus Dorms',
    customer: 'Tunde Kelani',
    time: 'In 15m',
    priority: false
  }
];

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';

export default function RiderDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    // Riders see orders that are 'Pending Pickup' or 'Ready for Handover'
    const riderTasks = allOrders
      .filter((o: any) => o.status === 'Pending Pickup' || o.status === 'Ready for Handover')
      .map((o: any) => ({
        id: o.id,
        type: o.status === 'Pending Pickup' ? 'Pickup' : 'Delivery',
        location: o.status === 'Pending Pickup' ? 'Customer Hostel' : 'Laundry Shop',
        customer: o.customerName,
        time: 'Now',
        priority: o.status === 'Pending Pickup'
      }));
    setTasks(riderTasks);
  }, []);

  const handleTaskAction = (taskId: string, type: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === taskId) {
        if (type === 'Pickup') {
          return { ...o, status: 'Picked Up', color: 'bg-secondary-container text-on-secondary-container' };
        } else {
          return { ...o, status: 'Handover', color: 'bg-success text-white' };
        }
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setTasks(prev => prev.filter(t => t.id !== taskId));
    alert(`Task ${taskId} ${type === 'Pickup' ? 'picked up' : 'delivered'} successfully!`);
  };
  
  return (
    <ProtectedRoute allowedRoles={['rider']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Rider" />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <Bike className="w-6 h-6 fill-current" />
                </div>
                <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">On Duty</p>
              </div>
              <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">
                {user?.fullName || 'Rider'}
              </h1>
              <div className="mt-4 flex items-center gap-3 bg-tertiary-container/20 px-4 py-2 rounded-xl border border-tertiary-container/30">
                <Zap className="text-tertiary w-4 h-4 fill-current" />
                <span className="text-xs font-headline font-black text-tertiary">820 Trust Points • Elite Rider</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-primary/5 text-center">
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Earnings</p>
              <p className="font-headline font-black text-2xl text-primary">₦12,400</p>
            </div>
          </header>
          {/* ... rest of the content ... */}

          {tasks.length > 0 && (
            <section className="bg-surface-container-low rounded-[2.5rem] p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/5">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shadow-inner">
                  <Navigation className="text-primary w-10 h-10 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-on-surface">Next Stop</h2>
                  <p className="text-on-surface-variant font-medium">{tasks[0].location}</p>
                </div>
              </div>
              <button className="signature-gradient text-white px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full md:w-auto">
                START NAVIGATION
              </button>
            </section>
          )}

        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-headline font-black text-on-surface">Your Queue</h3>
            <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">02 Tasks Remaining</span>
          </div>

          <div className="space-y-6">
            {tasks.map((task, idx) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "bg-surface-container-low rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 border border-primary/5",
                  task.priority && "ring-2 ring-primary ring-offset-4 ring-offset-surface"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm",
                  task.type === 'Pickup' ? "bg-primary-container text-primary" : "bg-tertiary-container text-tertiary"
                )}>
                  <Package className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h4 className="text-xl font-headline font-black text-on-surface">{task.type}: {task.location}</h4>
                    {task.priority && <span className="bg-error text-on-error font-label text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Urgent</span>}
                  </div>
                  <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Customer: {task.customer} • {task.id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center md:text-right">
                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Due</p>
                    <p className="font-headline font-bold text-on-surface">{task.time}</p>
                  </div>
                  <button className="p-4 rounded-2xl bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors active:scale-90">
                    <Phone className="w-5 h-5 fill-current" />
                  </button>
                  <button 
                    onClick={() => handleTaskAction(task.id, task.type)}
                    className="signature-gradient text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && (
              <div className="py-20 text-center bg-surface-container-low rounded-[2rem] border border-dashed border-primary/20">
                <p className="text-on-surface-variant font-headline font-bold text-xl">No tasks available right now.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
              <CheckCircle className="text-primary w-10 h-10" />
            </div>
            <h3 className="text-2xl font-headline font-black">Handover Complete?</h3>
            <p className="text-on-surface-variant font-medium max-w-xs">Enter the 4-digit code provided by the customer to complete this delivery.</p>
            <div className="flex gap-2 w-full max-w-xs">
              {[1, 2, 3, 4].map(i => (
                <input key={i} type="text" maxLength={1} className="w-full h-16 bg-surface-container rounded-xl text-center font-headline font-black text-2xl focus:ring-4 focus:ring-primary-container outline-none transition-all" />
              ))}
            </div>
            <button className="signature-gradient text-white px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full">
              CONFIRM HANDOVER
            </button>
          </section>

          <section className="bg-surface-container-lowest p-8 rounded-[2.5rem] border-2 border-dashed border-tertiary/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-tertiary/5 flex items-center justify-center">
              <Zap className="text-tertiary w-10 h-10 fill-current" />
            </div>
            <h3 className="text-2xl font-headline font-black">Report Rain</h3>
            <p className="text-on-surface-variant font-medium max-w-xs">Notify vendors and customers that delivery might be slower due to rain.</p>
            <button className="bg-tertiary text-on-tertiary px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:brightness-105 active:scale-95 transition-all w-full">
              REPORT RAIN 🌧️
            </button>
          </section>
        </section>
      </main>
    </div>
    </ProtectedRoute>
  );
}
