'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  WashingMachine, 
  Map, 
  User, 
  Home,
  LayoutDashboard,
  Tag,
  Bike,
  Droplets,
  LogOut,
  Activity,
  ShoppingBag,
  AlertTriangle,
  Users,
  Wallet,
  BarChart3,
  Megaphone,
  History
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, SiteSettings } from '@/lib/DatabaseService';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const customerItems: NavItem[] = [
  { label: 'Home', icon: Home, href: '/customer' },
  { label: 'Wash', icon: WashingMachine, href: '/vendors' },
  { label: 'Track', icon: Map, href: '/track' },
  { label: 'Wallet', icon: Wallet, href: '/wallet' },
  { label: 'Profile', icon: User, href: '/profile' },
];

const vendorItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/vendor' },
  { label: 'Price List', icon: Tag, href: '/vendor?tab=prices' },
  { label: 'Wallet', icon: Wallet, href: '/vendor?tab=payout' },
  { label: 'Settings', icon: User, href: '/vendor?tab=settings' },
];

const riderItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/rider' },
  { label: 'History', icon: History, href: '/rider?tab=history' },
  { label: 'Wallet', icon: Wallet, href: '/rider?tab=wallet' },
  { label: 'Settings', icon: User, href: '/rider?tab=settings' },
];

const adminItems: NavItem[] = [
  { label: 'Overview', icon: Activity, href: '/admin' },
  { label: 'Orders', icon: ShoppingBag, href: '/admin?tab=orders' },
  { label: 'Disputes', icon: AlertTriangle, href: '/admin?tab=disputes' },
  { label: 'Users', icon: Users, href: '/admin?tab=users' },
  { label: 'Wallets', icon: Wallet, href: '/admin?tab=wallets' },
  { label: 'Analytics', icon: BarChart3, href: '/admin?tab=analytics' },
  { label: 'Marketing', icon: Megaphone, href: '/admin?tab=marketing' },
  { label: 'Audit Log', icon: History, href: '/admin?tab=audit' },
  { label: 'Settings', icon: Map, href: '/admin?tab=settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);

  React.useEffect(() => {
    db.getSiteSettings().then(setSettings);
  }, []);

  const handleInvite = () => {
    const link = `https://quick-wash.campus/invite?ref=${user?.phoneNumber}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied! Invite friends to earn trust points.');
  };

  if (pathname === '/' || pathname.startsWith('/auth') || !user) return null;

  let items = customerItems;
  let roleLabel = 'Customer';
  
  if (user?.role === 'vendor') {
    items = vendorItems;
    roleLabel = 'Vendor Station';
  } else if (user?.role === 'rider') {
    items = riderItems;
    roleLabel = 'Rider Station';
  } else if (user?.role === 'admin') {
    items = adminItems;
    roleLabel = user?.phoneNumber === '09012345678' ? 'Super Admin' : 'Moderator Admin';
  }

  return (
    <aside className="w-72 bg-surface-container-low border-r border-primary/5 p-6 hidden lg:flex flex-col gap-2 h-screen sticky top-0">
      <div className="mb-8 px-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center shadow-lg">
          {settings?.logo ? (
            <Image src={settings.logo} alt="Logo" width={24} height={24} className="object-contain" unoptimized />
          ) : (
            <Droplets className="text-white w-6 h-6 fill-current" />
          )}
        </div>
        <div>
          <p className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">{roleLabel}</p>
          <h2 className="text-xl font-headline font-black text-on-surface tracking-tighter">
            {settings?.name || 'Quick-Wash'}
          </h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2">
        {items.map((item) => {
          const itemPath = item.href.split('?')[0];
          const itemTab = item.href.includes('?') ? new URLSearchParams(item.href.split('?')[1]).get('tab') : null;
          const currentTab = searchParams.get('tab');
          
          const isActive = pathname === itemPath && (itemTab ? currentTab === itemTab : !currentTab);
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all active:scale-95",
                isActive 
                  ? "signature-gradient text-white shadow-lg" 
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
              {item.label}
            </Link>
          );
        })}

        {user?.role === 'customer' && (
          <button
            onClick={handleInvite}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm text-primary hover:bg-primary/5 transition-all active:scale-95 mt-4 border-2 border-dashed border-primary/20"
          >
            <Users className="w-5 h-5" />
            Invite Friends
          </button>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-primary/5 space-y-4">
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-on-surface">All Systems Operational</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm text-error hover:bg-error/5 transition-all active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
