'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import VendorCard from '@/components/shared/VendorCard';
import { Volume2, MapPin, Search, SlidersHorizontal, DollarSign, Zap, Star, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const initialVendors = [
  {
    id: 'campus-cleans',
    name: 'Campus Cleans',
    priceRange: '₦2,500/KG',
    rating: 4.9,
    reviews: 128,
    distance: '0.4 km',
    turnaround: '6h Express',
    image: 'https://picsum.photos/seed/laundry1/800/600'
  },
  {
    id: 'adenike-bubbles',
    name: 'Adenike Bubbles',
    priceRange: '₦1,800/KG',
    rating: 4.7,
    reviews: 85,
    distance: '1.2 km',
    turnaround: '12h Standard',
    image: 'https://picsum.photos/seed/laundry2/800/600'
  },
  {
    id: 'laundry-hub',
    name: 'The Laundry Hub',
    priceRange: '₦3,200/KG',
    rating: 5.0,
    reviews: 210,
    distance: '2.5 km',
    turnaround: '4h Ultra-Fast',
    image: 'https://picsum.photos/seed/laundry3/800/600'
  }
];

const sortOptions = [
  { id: 'cheapest', label: 'Cheapest', icon: DollarSign },
  { id: 'fastest', label: 'Fastest', icon: Zap },
  { id: 'highest-rated', label: 'Highest Rated', icon: Star },
  { id: 'closest', label: 'Closest', icon: Navigation },
];

export default function VendorSelectionPage() {
  const [selectedSort, setSelectedSort] = React.useState('highest-rated');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [vendors, setVendors] = React.useState(initialVendors);

  React.useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const approvedVendors = allUsers
      .filter((u: any) => u.role === 'vendor' && u.isApproved)
      .map((u: any) => ({
        id: u.phoneNumber,
        name: u.shopName || u.fullName || 'Anonymous Vendor',
        priceRange: '₦2,000/KG', // Default price range
        rating: 4.5,
        reviews: 0,
        distance: 'Local',
        turnaround: '24h Standard',
        image: `https://picsum.photos/seed/${u.phoneNumber}/800/600`
      }));
    
    // Merge initial vendors with approved ones from localStorage
    setVendors([...initialVendors, ...approvedVendors]);
  }, []);

  const filteredVendors = React.useMemo(() => {
    let result = [...vendors];

    // Filter by search
    if (searchQuery) {
      result = result.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (selectedSort === 'cheapest') {
        const priceA = parseInt(a.priceRange.replace(/[^0-9]/g, ''));
        const priceB = parseInt(b.priceRange.replace(/[^0-9]/g, ''));
        return priceA - priceB;
      }
      if (selectedSort === 'fastest') {
        const timeA = parseInt(a.turnaround.replace(/[^0-9]/g, ''));
        const timeB = parseInt(b.turnaround.replace(/[^0-9]/g, ''));
        return timeA - timeB;
      }
      if (selectedSort === 'highest-rated') {
        return b.rating - a.rating;
      }
      if (selectedSort === 'closest') {
        const distA = parseFloat(a.distance.replace(/[^0-9.]/g, ''));
        const distB = parseFloat(b.distance.replace(/[^0-9.]/g, ''));
        return distA - distB;
      }
      return 0;
    });

    return result;
  }, [selectedSort, searchQuery, vendors]);

  return (
    <div className="pb-32">
      <TopAppBar showAudioToggle />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
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

          <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
            <div className="bg-surface-container-highest p-4 rounded-2xl flex items-center justify-center">
              <SlidersHorizontal className="w-6 h-6 text-on-surface" />
            </div>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedSort(option.id)}
                className={cn(
                  "flex-shrink-0 px-8 py-4 rounded-2xl font-headline font-black text-sm flex items-center gap-3 transition-all active:scale-95",
                  selectedSort === option.id 
                    ? "signature-gradient text-white shadow-lg" 
                    : "bg-surface-container-low text-on-surface-variant border border-primary/5"
                )}
              >
                <option.icon className={cn("w-5 h-5", selectedSort === option.id && "fill-current")} />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Vendor Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredVendors.map((vendor) => (
            <VendorCard 
              key={vendor.id}
              {...vendor}
            />
          ))}
          {filteredVendors.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-on-surface-variant font-headline font-bold text-xl">No vendors found matching your search.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
