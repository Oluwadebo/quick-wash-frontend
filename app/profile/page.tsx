'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Wallet, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Bell,
  Info,
  Clock,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UserData, db } from '@/lib/DatabaseService';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      db.getUser(user.uid).then(u => {
        if (u) setWalletBalance(u.walletBalance || 0);
      });
    }
  }, [user]);

  if (!user) return null;

  const sections = [
    {
      title: "Account",
      items: [
        { label: 'Name', value: user.fullName, icon: User },
        { label: 'Role', value: user.role.toUpperCase(), icon: ShieldCheck },
        { label: 'Phone', value: user.phoneNumber, icon: Phone },
        { label: 'Email', value: user.email, icon: Mail },
      ]
    },
    {
      title: "Preferences",
      items: [
        { label: 'Hostel/Landmark', value: user.landmark || 'Not set', icon: MapPin },
        { label: 'Notifications', value: 'Enabled', icon: Bell },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="pt-20 px-8 pb-12 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-surface-container flex items-center justify-center overflow-hidden border-4 border-white shadow-xl relative">
               <Image src={`https://picsum.photos/seed/${user.uid}/200/200`} alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
            </div>
            <button className="absolute bottom-2 right-2 w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
               <User className="w-5 h-5" />
            </button>
          </div>
          
          <h1 className="text-3xl font-headline font-black tracking-tighter text-on-surface mb-1">{user.fullName}</h1>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">{user.role}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-8 mt-4">
        {/* Wallet Quick Access */}
        <button 
          onClick={() => router.push(user.role === 'customer' ? '/customer/wallet' : `/${user.role}?tab=wallet`)}
          className="w-full p-8 bg-zinc-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
               <Wallet className="w-8 h-8" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Available Balance</p>
              <p className="text-4xl font-headline font-black tracking-tighter">₦{walletBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-all">
             <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant px-2">{section.title}</h3>
            <div className="bg-white rounded-[2rem] overflow-hidden border border-primary/5 shadow-sm">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className={cn(
                  "p-5 flex items-center gap-4",
                  iIdx !== section.items.length - 1 && "border-b border-primary/5"
                )}>
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{item.label}</p>
                    <p className="font-headline font-black text-sm text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          <button className="h-16 rounded-2xl bg-white border border-primary/5 flex items-center justify-center gap-2 font-headline font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-primary/5 transition-all">
             <History className="w-4 h-4" />
             Order History
          </button>
          <button className="h-16 rounded-2xl bg-white border border-primary/5 flex items-center justify-center gap-2 font-headline font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-primary/5 transition-all">
             <CreditCard className="w-4 h-4" />
             Bank Details
          </button>
        </div>

        <button 
          onClick={logout}
          className="w-full h-18 bg-error/10 text-error rounded-3xl font-headline font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-error/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-error/20"
        >
          <LogOut className="w-5 h-5" />
          Terminate Session
        </button>

        <div className="text-center py-8">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-on-surface-variant opacity-20">Quick-Wash Core v1.2.8</p>
        </div>
      </main>
    </div>
  );
}
