'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { db, UserData } from '@/lib/DatabaseService';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Droplets,
  Filter,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = React.useState<UserData[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    db.getVendors().then(data => {
      setVendors(data.filter(v => v.isApproved));
      setLoading(false);
    });
  }, []);

  const filtered = vendors.filter(v => 
    v.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    v.landmark?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><Droplets className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-surface pb-32">
       <header className="pt-20 px-6 pb-12 bg-white border-b border-primary/5">
          <div className="max-w-7xl mx-auto">
             <h1 className="text-5xl font-headline font-black tracking-tighter mb-8 italic">Choose your <span className="text-primary">Hero.</span></h1>
             
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by hostel or laundry name..."
                  className="w-full h-18 bg-surface-container rounded-[2rem] pl-16 pr-8 text-lg font-medium outline-none focus:ring-4 ring-primary/10 transition-all border border-transparent focus:border-primary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
       </header>

       <main className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between px-2">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Available Partners ({filtered.length})</p>
             <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <Filter className="w-4 h-4" />
                Sort & Filter
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <AnimatePresence mode="popLayout">
                {filtered.map((vendor, idx) => (
                  <motion.div 
                    key={vendor.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => router.push(`/customer?vendorId=${vendor.uid}`)}
                    className="group bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-2xl transition-all cursor-pointer border border-primary/5 relative overflow-hidden"
                  >
                    <div className="relative h-64 rounded-[2rem] overflow-hidden mb-6">
                       <Image 
                         src={vendor.shopImage || `https://picsum.photos/seed/${vendor.uid}/600/600`}
                         alt={vendor.shopName || 'Vendor'}
                         fill
                         className="object-cover group-hover:scale-110 transition-transform duration-700"
                         referrerPolicy="no-referrer"
                         unoptimized
                       />
                       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-1 shadow-xl">
                          <Star className="w-4 h-4 text-secondary fill-current" />
                          <span className="text-sm font-headline font-black">4.9</span>
                       </div>
                       <div className="absolute bottom-4 left-4 bg-primary/90 backdrop-blur-md px-4 py-2 rounded-xl text-white flex items-center gap-2 shadow-xl">
                          <Zap className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Express Hero</span>
                       </div>
                    </div>

                    <div className="px-4 pb-6">
                       <h3 className="text-2xl font-headline font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                         {vendor.shopName}
                       </h3>
                       <div className="flex items-center gap-2 text-on-surface-variant font-medium text-sm mb-4">
                          <MapPin className="w-4 h-4 text-primary" />
                          {vendor.landmark || 'Nearby Campus'}
                       </div>
                       
                       <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                          <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-on-surface-variant" />
                             <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{vendor.turnaroundTime || '24h'} Turnaround</span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <ChevronRight className="w-6 h-6" />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>
       </main>
    </div>
  );
}
