'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Search, MapPin, ChevronRight, Plus, HelpCircle, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const landmarks = [
  {
    id: 'lautech-gate',
    name: 'LAUTECH Main Gate',
    tag: 'Primary Hub',
    image: 'https://picsum.photos/seed/lautech/800/400',
    featured: true
  },
  {
    id: 'under-g',
    name: 'Under G',
    info: '4 Wash Hubs nearby',
    icon: 'school'
  },
  {
    id: 'adenike',
    name: 'Adenike',
    info: '9 active vendors',
    icon: 'apartment'
  },
  {
    id: 'cele-area',
    name: 'Cele Area',
    info: 'Express pickup available',
    icon: 'church',
    fullWidth: true
  },
  {
    id: 'fapote',
    name: 'Fapote',
    icon: 'science'
  },
  {
    id: 'stadium',
    name: 'Stadium',
    icon: 'store'
  }
];

import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function LandmarkSelectionPage() {
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    setUser(currentUser);
    setRecentOrders(allOrders.filter((o: any) => o.customerPhone === currentUser.phoneNumber));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="pb-32">
        <TopAppBar />
        
        <main className="pt-24 px-6 max-w-2xl mx-auto">
          {/* ... existing content ... */}
        {/* Trust Points Header */}
        <section className="mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center shadow-lg">
                <Zap className="text-on-tertiary-container w-8 h-8 fill-current" />
              </div>
              <div>
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Your Trust Status</p>
                <h3 className="text-2xl font-headline font-black text-on-surface">
                  {user?.trustPoints || 0} Points • <span className="text-tertiary">{user?.trustPoints >= 500 ? 'Elite' : 'Standard'}</span>
                </h3>
              </div>
            </div>
            <Link href="/profile" className="p-4 rounded-2xl bg-white shadow-sm hover:bg-primary-container transition-colors">
              <ChevronRight className="text-primary w-6 h-6" />
            </Link>
          </motion.div>
        </section>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Your Recent Orders</h3>
              <Link href="/track" className="text-primary font-headline font-bold text-xs">View All</Link>
            </div>
            <div className="space-y-4">
              {recentOrders.slice(0, 2).map((order) => (
                <Link 
                  key={order.id} 
                  href={`/track/${order.id}`}
                  className="block bg-surface-container-low p-6 rounded-3xl border border-primary/5 hover:border-primary/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-headline font-black text-on-surface">Order #{order.id}</h4>
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", order.color)}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium line-clamp-1">{order.items}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <header className="mb-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[3.5rem] font-headline font-black leading-tight tracking-tight text-on-surface mb-2"
          >
            Pick your spot.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant font-medium leading-relaxed max-w-sm"
          >
            We&apos;ll find the nearest wash hub around your campus area.
          </motion.p>
        </header>

        <section className="space-y-4 mb-10">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
            <input 
              className="w-full h-16 pl-14 pr-6 bg-surface-container-low border-none rounded-3xl text-on-surface placeholder:text-on-surface-variant focus:ring-0 focus:bg-surface-container-lowest transition-all"
              placeholder="Search areas (e.g. Under G)"
              type="text"
            />
          </div>
          
          <button className="w-full h-16 bg-surface-container-lowest flex items-center justify-center gap-3 rounded-3xl shadow-sm active:scale-[0.98] transition-transform">
            <MapPin className="text-primary w-5 h-5" />
            <span className="font-bold text-primary">Use Current Location</span>
          </button>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between my-8">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Popular Landmarks</h3>
            <span className="h-0.5 flex-1 bg-primary/10 ml-4"></span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {landmarks.map((landmark, idx) => (
              <Link 
                key={landmark.id} 
                href="/vendors"
                className={cn(
                  "relative rounded-3xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform",
                  landmark.featured ? "col-span-2 h-48" : landmark.fullWidth ? "col-span-2 flex items-center gap-6 bg-surface-container-low p-6" : "bg-surface-container-low p-6 flex flex-col justify-between aspect-square"
                )}
              >
                {landmark.featured ? (
                  <>
                    <Image 
                      src={landmark.image!} 
                      alt={landmark.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dim/90 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div>
                        <span className="bg-primary-container text-on-primary-container text-[10px] font-label font-bold px-3 py-1 rounded-full mb-2 inline-block uppercase">
                          {landmark.tag}
                        </span>
                        <h4 className="text-2xl font-bold text-white">{landmark.name}</h4>
                      </div>
                      <ChevronRight className="text-white w-8 h-8" />
                    </div>
                  </>
                ) : landmark.fullWidth ? (
                  <>
                    <div className="w-14 h-14 bg-secondary-container/50 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="text-secondary w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-on-surface">{landmark.name}</h4>
                      <p className="text-sm font-label text-on-surface-variant font-medium">{landmark.info}</p>
                    </div>
                    <ChevronRight className="text-outline w-6 h-6" />
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-primary-container/30 rounded-2xl flex items-center justify-center">
                      <MapPin className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-on-surface">{landmark.name}</h4>
                      {landmark.info && (
                        <p className="text-sm font-label text-on-surface-variant font-medium">{landmark.info}</p>
                      )}
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-sm text-on-surface-variant mb-6 font-medium">Don&apos;t see your area?</p>
          <button className="signature-gradient w-full h-16 rounded-3xl text-on-primary font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.95] transition-transform shadow-lg">
            <Plus className="w-6 h-6" />
            Enter Address Manually
          </button>
        </section>
      </main>
    </div>
    </ProtectedRoute>
  );
}
