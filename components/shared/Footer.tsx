"use client";

import { api, SiteSettings } from "@/lib/ApiService";
import { Droplets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);

  React.useEffect(() => {
    api.getSiteSettings().then(setSettings);
  }, []);

  // Hide footer on dashbaords and auth pages to prevent double showing or cluttering
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/customer') || pathname.startsWith('/vendor') || pathname.startsWith('/rider');
  const isAuth = pathname.startsWith('/auth');
  
  if (isDashboard || isAuth) return null;

  return (
    <footer className="py-16 px-6 border-t-2 border-primary/10 bg-surface">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Logo & Brand Section */}
        <Link href="/" className="group flex items-center justify-center gap-3 mb-8 transition-transform hover:scale-105">
          <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center shadow-lg transition-all group-hover:shadow-primary/20">
            {settings?.logo ? (
              <Image
                src={settings.logo}
                alt="Logo"
                width={24}
                height={24}
                className="object-contain"
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <Droplets className="text-white w-6 h-6 fill-current" />
            )}
          </div>
          <span className="text-2xl font-headline font-black tracking-tighter text-on-surface">
            {settings?.name || "Quick-Wash"}
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-8 mb-12">
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
        </nav>

        {/* Branding Footer */}
        <div className="space-y-4 text-center">
          <p className="font-label text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">
            Built for the Modern Campus • {currentYear}
          </p>

          <p className="text-[9px] font-bold text-primary/40 uppercase tracking-tighter">
            Quick-Wash Logistics Engine v1.2
          </p>
        </div>
      </div>
    </footer>
  );
}
