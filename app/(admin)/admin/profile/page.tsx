'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Shield, LogOut, User, Mail, Phone, Calendar, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function AdminProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="pb-32">
      <TopAppBar title="Admin Profile" roleLabel="Admin" />

      <main className="pt-8 px-6 max-w-2xl mx-auto space-y-8">
          <section className="flex flex-col items-center text-center space-y-4">
            <div className="w-32 h-32 rounded-[2.5rem] signature-gradient flex items-center justify-center shadow-2xl">
              <Shield className="text-white w-16 h-16" />
            </div>
            <div>
              <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter">{user?.fullName || 'System Administrator'}</h2>
              <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary mt-1">Super Admin Access</p>
            </div>
          </section>

          <section className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Full Name</p>
                <p className="font-headline font-bold text-on-surface">{user?.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Email Address</p>
                <p className="font-headline font-bold text-on-surface">{user?.email || 'admin@quick-wash.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Phone Number</p>
                <p className="font-headline font-bold text-on-surface">{user?.phoneNumber}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-primary/5 shadow-sm">
              <Activity className="text-primary w-6 h-6 mb-4" />
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">System Status</p>
              <h3 className="text-xl font-headline font-black text-on-surface">Optimal</h3>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-primary/5 shadow-sm">
              <Calendar className="text-primary w-6 h-6 mb-4" />
              <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Last Login</p>
              <h3 className="text-xl font-headline font-black text-on-surface">Today</h3>
            </div>
          </section>

          <button 
            onClick={logout}
            className="w-full py-6 rounded-[2rem] bg-error/10 text-error font-headline font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <LogOut className="w-6 h-6" />
            Logout from System
          </button>
        </main>
      </div>
  );
}
