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
  History,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api, SiteSettings } from '@/lib/ApiService';
import { io } from 'socket.io-client';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const customerItems: NavItem[] = [
  { label: 'Home', icon: Home, href: '/customer' },
  { label: 'Wash', icon: WashingMachine, href: '/vendors' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Track', icon: Map, href: '/track' },
  { label: 'Wallet', icon: Wallet, href: '/wallet' },
  { label: 'Profile', icon: User, href: '/profile' },
];

const vendorItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/vendor' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Price List', icon: Tag, href: '/vendor?tab=prices' },
  { label: 'Wallet', icon: Wallet, href: '/vendor?tab=payout' },
  { label: 'Settings', icon: User, href: '/vendor?tab=settings' },
];

const riderItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/rider' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'History', icon: History, href: '/rider?tab=history' },
  { label: 'Wallet', icon: Wallet, href: '/rider?tab=wallet' },
  { label: 'Settings', icon: User, href: '/rider?tab=settings' },
];

const adminItems: NavItem[] = [
  { label: 'Overview', icon: Activity, href: '/admin' },
  { label: 'Orders', icon: ShoppingBag, href: '/admin?tab=orders' },
  { label: 'Disputes', icon: AlertTriangle, href: '/admin?tab=disputes' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
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
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (user?.uid) {
      try {
        const count = await api.getUnreadCount(user.uid);
        setUnreadCount(count);
      } catch (err) {}
    }
  }, [user]);

  React.useEffect(() => {
    api.getSiteSettings().then(setSettings);
    fetchUnreadCount();

    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on("connect", () => {
      if (user?.uid) socket.emit("join_user", user.uid);
    });

    socket.on("new_message", (msg) => {
      if (msg.receiverId === user?.uid) {
        fetchUnreadCount();
      }
    });

    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    window.addEventListener('chat_unread_update', fetchUnreadCount);
    window.addEventListener('storage', fetchUnreadCount);

    return () => {
      socket.disconnect();
      clearInterval(interval);
      window.removeEventListener('chat_unread_update', fetchUnreadCount);
      window.removeEventListener('storage', fetchUnreadCount);
    };
  }, [fetchUnreadCount, user?.uid]);

  const handleInvite = async () => {
    const link = `https://quick-wash.campus/invite?ref=${user?.phoneNumber}`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Quick-Wash',
          text: 'Join me on Quick-Wash for fast, premium laundry services!',
          url: link
        });
        return;
      } catch (err) {
        console.log('Share failed:', err);
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        alert('Referral link copied! Share it with friends to earn trust points.');
      } else {
        alert('Invite link: ' + link);
      }
    } catch (err) {
      alert('Invite link: ' + link);
    }
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
  } else if (user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'super-sub-admin') {
    items = adminItems;
    const isSuperAdmin = user?.role === 'super-admin' || user?.email === 'ogunweoluwadebo1@gmail.com' || user?.phoneNumber === '07048865686';
    roleLabel = isSuperAdmin ? 'Super Admin' : (user?.role === 'super-sub-admin' ? 'Super Admin (Sub)' : 'Moderator Admin');
  }

  return (
    <aside className="w-72 bg-surface-container-low border-r border-primary/5 p-6 hidden lg:flex flex-col gap-2 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="mb-8 px-4 flex items-center gap-3 shrink-0">
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
                "flex items-center justify-between px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all active:scale-95 group",
                isActive 
                  ? "signature-gradient text-white shadow-lg" 
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                {item.label}
              </div>
              {item.label === 'Chat' && unreadCount > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black",
                  isActive ? "bg-white text-primary" : "bg-primary text-on-primary"
                )}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {user?.role === 'customer' && (
          <button
            onClick={handleInvite}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm text-primary hover:bg-primary/5 transition-all active:scale-95 mt-4 border-2 border-dashed border-primary/20 shrink-0"
          >
            <Users className="w-5 h-5" />
            Invite Friends
          </button>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-primary/5 space-y-4 shrink-0">
        {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'super-sub-admin') && (
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-on-surface">All Systems Operational</span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm text-error hover:bg-error/5 transition-all active:scale-95 text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
