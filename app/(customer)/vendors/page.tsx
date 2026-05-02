'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TopAppBar from '@/components/shared/TopAppBar';
import VendorCard from '@/components/shared/VendorCard';
import { Volume2, MapPin, Search, SlidersHorizontal, DollarSign, Zap, Star, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const sortOptions = [
  { id: 'cheapest', label: 'Cheapest', icon: DollarSign },
  { id: 'fastest', label: 'Fastest', icon: Zap },
  { id: 'highest-rated', label: 'Highest Rated', icon: Star },
  { id: 'closest', label: 'Closest', icon: Navigation },
];

function VendorSelectionContent() {
  const searchParams = useSearchParams();
  const initialLandmark = searchParams.get('landmark') || '';
  const [selectedSort, setSelectedSort] = React.useState('highest-rated');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLandmark, setSelectedLandmark] = React.useState(initialLandmark);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vendors');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const approvedVendors = data.map((u: any) => ({
            id: u.uid,
            name: u.shopName || u.fullName || 'Anonymous Vendor',
            priceRange: u.priceRange || '₦2,000/KG', 
            rating: u.trustPoints ? Math.min(5, 3.5 + (u.trustPoints / 200)) : 4.5,
            reviews: Math.floor(Math.random() * 50) + 5,
            distance: u.distance || '0.5 km',
            landmark: u.landmark,
            address: u.shopAddress || u.address,
            turnaround: u.turnaroundTime || '24h Standard',
            image: u.shopImage || `https://picsum.photos/seed/laundry-${u.phoneNumber}/800/600`,
            isRaining: u.isRaining || false,
            isShopClosed: u.isShopClosed || false,
            returnTime: u.returnTime
          }));
          setVendors(approvedVendors);
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const filteredVendors = React.useMemo(() => {
    let result = [...vendors];

    // Filter by landmark
    if (selectedLandmark) {
      const sL = selectedLandmark.trim().toLowerCase();
      console.log(`[VendorsPage] Filtering by landmark: "${selectedLandmark}" (normalized: "${sL}")`);
      result = result.filter(v => {
        if (!v.landmark) return false;
        const vL = v.landmark.trim().toLowerCase();
        const match = vL === sL || vL.includes(sL) || sL.includes(vL);
        if (match) {
          console.log(`[VendorsPage] Match found: Vendor "${v.name}" has landmark "${v.landmark}"`);
        }
        return match;
      });
    }

    // Filter by search
    if (searchQuery) {
      result = result.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.landmark?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (selectedSort === 'cheapest') {
        const priceA = parseInt(a.priceRange?.replace(/[^0-9]/g, '') || '2000');
        const priceB = parseInt(b.priceRange?.replace(/[^0-9]/g, '') || '2000');
        return priceA - priceB;
      }
      if (selectedSort === 'fastest') {
        const timeA = parseInt(a.turnaround?.replace(/[^0-9]/g, '') || '24');
        const timeB = parseInt(b.turnaround?.replace(/[^0-9]/g, '') || '24');
        return timeA - timeB;
      }
      if (selectedSort === 'highest-rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (selectedSort === 'closest') {
        const distA = parseFloat(a.distance?.replace(/[^0-9.]/g, '') || '1');
        const distB = parseFloat(b.distance?.replace(/[^0-9.]/g, '') || '1');
        return distA - distB;
      }
      return 0;
    });

    return result;
  }, [selectedSort, searchQuery, vendors, selectedLandmark]);

  return (
    <div className="pb-32">
      <TopAppBar showAudioToggle />
      
      <main className="pt-8 px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[3.5rem] font-headline font-black leading-[1.1] tracking-tight mb-4 text-on-surface"
          >
            Choose your Expert
          </motion.h2>
          <div className="flex items-center gap-3 text-primary font-semibold">
            <Volume2 className="w-6 h-6 fill-current" />
            <p className="text-lg font-headline">Choose your laundry station.</p>
          </div>
        </header>

        {/* Search and Filter */}
        <section className="mb-12 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant w-6 h-6" />
            <input 
              type="text" 
              placeholder="Search for a shop or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-20 bg-surface-container-low rounded-[2rem] pl-16 pr-8 font-headline font-bold text-lg focus:ring-4 focus:ring-primary-container outline-none transition-all border border-primary/5"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-6 hide-scrollbar -mx-2 px-2">
            <div className="bg-success/10 p-4 rounded-2xl flex items-center justify-center shrink-0 border border-success/20">
              <SlidersHorizontal className="w-6 h-6 text-success" />
            </div>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedSort(option.id)}
                className={cn(
                  "flex-shrink-0 px-8 py-4 rounded-2xl font-headline font-black text-sm flex items-center gap-3 transition-all active:scale-95 border-2",
                  selectedSort === option.id 
                    ? "bg-success text-white border-success shadow-lg shadow-success/20" 
                    : "bg-success/5 text-success border-success/10 hover:bg-success/10"
                )}
              >
                <option.icon className={cn("w-5 h-5", selectedSort === option.id ? "fill-white" : "fill-current")} />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Vendor Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant font-headline font-bold text-xl">Loading vendors...</p>
            </div>
          ) : filteredVendors.length > 0 ? (
            filteredVendors.map((vendor, idx) => (
              <VendorCard 
                key={vendor.id || `vendor-${idx}`}
                {...vendor}
              />
            ))
          ) : (
            <div key="no-vendors" className="col-span-full py-20 text-center">
              <p className="text-on-surface-variant font-headline font-bold text-xl">No vendors found matching your search.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function VendorSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex flex-col items-center justify-center font-headline font-black">Loading vendors...</div>}>
      <VendorSelectionContent />
    </Suspense>
  );
}
