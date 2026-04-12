'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  WashingMachine, 
  Map, 
  ShieldCheck, 
  User, 
  ReceiptText, 
  History, 
  Wallet, 
  Home,
  LayoutDashboard,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  role?: 'customer' | 'vendor' | 'rider' | 'admin';
}

const customerItems: NavItem[] = [
  { label: 'Home', icon: Home, href: '/customer' },
  { label: 'Wash', icon: WashingMachine, href: '/vendors' },
  { label: 'Track', icon: Map, href: '/track/8821' },
  { label: 'Profile', icon: User, href: '/profile' },
];

const vendorItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, href: '/vendor' },
  { label: 'Prices', icon: Tag, href: '/vendor/price-list' },
  { label: 'Orders', icon: ReceiptText, href: '/vendor' },
  { label: 'Account', icon: User, href: '/vendor/profile' },
];

const riderItems: NavItem[] = [
  { label: 'Home', icon: Home, href: '/rider' },
  { label: 'Orders', icon: WashingMachine, href: '/rider' },
  { label: 'Wallet', icon: Wallet, href: '/rider' },
  { label: 'Account', icon: User, href: '/rider/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  
  let items = customerItems;
  if (pathname.includes('/vendor')) items = vendorItems;
  else if (pathname.includes('/rider')) items = riderItems;
  else if (pathname.includes('/admin')) items = []; // Admin might not need bottom nav
  else if (pathname === '/' || pathname.startsWith('/auth')) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-zinc-900 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.label === 'Account' && pathname.includes('profile'));
        
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-5 py-2 transition-all duration-300 ease-out active:scale-90",
              isActive 
                ? "bg-primary/20 text-primary rounded-[1.5rem]" 
                : "text-white/40"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
            <span className="font-label text-[10px] font-black uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
