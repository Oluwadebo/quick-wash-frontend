'use client';

import React from 'react';
import Link from 'next/link';
import { Droplets, Github, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-24 px-6 border-t-2 border-primary/10 bg-surface">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <Link
          href="/"
          className="group flex items-center justify-center gap-3 mb-8 transition-transform hover:scale-105"
        >
          <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center shadow-lg">
            <Droplets className="text-white w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-headline font-black tracking-tighter text-on-surface">
            Quick-Wash
          </span>
        </Link>

        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <Link
            href="/contact"
            className="text-on-surface-variant font-bold hover:text-primary transition-colors uppercase text-[10px] tracking-widest"
          >
            Contact Us
          </Link>
          <Link
            href="/privacy"
            className="text-on-surface-variant font-bold hover:text-primary transition-colors uppercase text-[10px] tracking-widest"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-on-surface-variant font-bold hover:text-primary transition-colors uppercase text-[10px] tracking-widest"
          >
            Terms of Service
          </Link>
        </div>

        <p className=" text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40 text-center">
          Built for the Modern Campus • {currentYear}
        </p>
        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
          Quick-Wash Logistics Engine v1.2
        </p>
      </div>
    </footer>
  );
}
