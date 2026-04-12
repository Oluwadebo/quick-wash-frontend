'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import Image from 'next/image';
import { Users, ShoppingBag, TrendingUp, AlertTriangle, ShieldCheck, Map, Activity, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Total Revenue', value: '₦1,240,500', trend: '+18.2%', icon: TrendingUp, color: 'text-primary' },
  { label: 'Active Orders', value: '142', trend: '+5.4%', icon: ShoppingBag, color: 'text-tertiary' },
  { label: 'Total Users', value: '2,840', trend: '+12.1%', icon: Users, color: 'text-on-surface' },
  { label: 'System Health', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-primary' }
];

const alerts = [
  { id: 1, type: 'Weather', msg: 'Rain reported in Under G by 4 vendors.', time: '10m ago', icon: AlertTriangle, color: 'bg-error-container text-on-error-container' },
  { id: 2, type: 'Security', msg: 'Escrow released for Order #8812.', time: '25m ago', icon: ShieldCheck, color: 'bg-primary-container text-on-primary-container' }
];

export default function AdminDashboard() {
  return (
    <div className="pb-32">
      <TopAppBar roleLabel="Admin" />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <header className="mb-10">
          <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Control Center</p>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">
            System Overview
          </h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl bg-surface-container-lowest shadow-sm", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">{stat.trend}</span>
              </div>
              <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-headline font-black text-on-surface">{stat.value}</h3>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-black text-on-surface">Live Map Activity</h2>
              <button className="text-primary font-headline font-bold text-sm flex items-center gap-2">
                Open Full Map <Map className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-surface-container-lowest aspect-video rounded-[2.5rem] border border-primary/5 shadow-sm relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 grayscale">
                <Image 
                  src="https://picsum.photos/seed/map/1200/800" 
                  alt="Map Placeholder"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                  <div className="w-4 h-4 bg-tertiary rounded-full animate-ping delay-75"></div>
                  <div className="w-4 h-4 bg-error rounded-full animate-ping delay-150"></div>
                </div>
                <p className="font-headline font-bold text-on-surface-variant">12 Riders Active • 45 Deliveries in Progress</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black text-on-surface">System Alerts</h2>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-surface-container-low p-5 rounded-[1.8rem] border border-primary/5 flex gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", alert.color)}>
                    <alert.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-headline font-bold text-sm">{alert.type}</span>
                      <span className="font-label text-[10px] font-bold text-on-surface-variant">{alert.time}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">{alert.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 rounded-2xl bg-surface-container-highest text-on-surface font-headline font-bold text-sm hover:bg-surface-variant transition-colors">
              View All Logs
            </button>
          </section>
        </div>

        <section className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-headline font-black text-on-surface">Recent Transactions</h2>
            <button className="signature-gradient text-white px-6 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 shadow-lg">
              Export CSV <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/5">
                  <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">User</th>
                  <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Amount</th>
                  <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {[1, 2, 3].map(i => (
                  <tr key={i} className="group hover:bg-surface-container-lowest transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant"></div>
                        <span className="font-headline font-bold text-sm">User_{i}482</span>
                      </div>
                    </td>
                    <td className="py-4 font-headline font-black text-sm text-primary">₦4,500.00</td>
                    <td className="py-4">
                      <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Success</span>
                    </td>
                    <td className="py-4 font-label text-[10px] font-bold text-on-surface-variant">14:2{i} PM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
