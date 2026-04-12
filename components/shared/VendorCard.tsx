'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, MessageCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  priceRange: string;
  distance: string;
  turnaround: string;
  isStudentFriendly?: boolean;
  whatsappNumber?: string;
}

export default function VendorCard({
  id,
  name,
  image,
  rating,
  reviews,
  priceRange,
  distance,
  turnaround,
  isStudentFriendly = true,
  whatsappNumber = '2348000000000'
}: VendorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-surface-container-low rounded-[2.5rem] overflow-hidden border border-primary/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5"
    >
      {/* Big Shop Photo */}
      <div className="relative h-72 w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {isStudentFriendly && (
            <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md">
              <Zap className="w-3 h-3 fill-current" />
              Student Friendly
            </span>
          )}
          <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 fill-current" />
            Verified
          </span>
        </div>

        {/* Rating Overlay */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center gap-2 shadow-xl">
            <Star className="text-tertiary w-5 h-5 fill-current" />
            <span className="font-headline font-black text-lg">{rating}</span>
            <span className="text-on-surface-variant text-xs font-bold">({reviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-3xl font-headline font-black text-on-surface tracking-tight mb-1">{name}</h3>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">{distance}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">{turnaround}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Starts From</p>
            <p className="text-2xl font-headline font-black text-primary">{priceRange}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-5 rounded-2xl font-headline font-black text-sm shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-6 h-6 fill-current" />
            WhatsApp
          </a>
          <Link
            href={`/order?vendor=${id}`}
            className="signature-gradient text-white py-5 rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Choose Vendor
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
