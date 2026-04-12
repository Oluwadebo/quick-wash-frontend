'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import VendorCard from '@/components/shared/VendorCard';
import { Volume2, MapPin, Search, SlidersHorizontal, DollarSign, Zap, Star, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const vendors = [
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
            <p className="text-lg font-headline">Yan ibùdó ìfọṣọ rẹ.</p>
          </div>
        </header>

        {/* Search and Filter */}
        <section className="mb-12 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant w-6 h-6" />
            <input 
              type="text" 
              placeholder="Search for a shop or area..."
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
          {vendors.map((vendor) => (
            <VendorCard 
              key={vendor.id}
              {...vendor}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
