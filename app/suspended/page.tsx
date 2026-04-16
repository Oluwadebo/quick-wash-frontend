'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function SuspendedPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.status !== 'suspended' && user?.status !== 'restricted') {
    // If they are active, send them back
    if (typeof window !== 'undefined') {
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface-container-low rounded-[3rem] p-10 border-2 border-error/20 shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-headline font-black text-on-surface mb-4">Account {user?.status === 'suspended' ? 'Suspended' : 'Restricted'}</h1>
        
        <div className="bg-error/5 p-6 rounded-2xl border border-error/10 mb-8">
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            {user?.status === 'suspended' 
              ? "Your account has been suspended due to low Trust Points (below 30). You must submit an appeal to the Admin to restore access."
              : `Your account is temporarily restricted due to low Trust Points (below 60). You cannot place or accept orders until ${user?.restrictionExpires ? new Date(user.restrictionExpires).toLocaleDateString() : 'further notice'}.`}
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => window.open('mailto:support@quickwash.com')}
            className="w-full h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-6 h-6" />
            CONTACT SUPPORT
          </button>
          
          <Link 
            href="/auth?login=true"
            className="w-full h-16 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO LOGIN
          </Link>
        </div>

        <p className="mt-8 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Quick-Wash Security System</p>
      </motion.div>
    </div>
  );
}
