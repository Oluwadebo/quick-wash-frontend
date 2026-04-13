'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'motion/react';
import { Droplets, ShieldCheck, Lock, Phone, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminSignupPage() {
  const { signup, isProcessing, error } = useAuth();
  const [formData, setFormData] = React.useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'admin' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(formData);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] signature-gradient flex items-center justify-center shadow-2xl mx-auto mb-6">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter mb-2">Admin Access</h1>
          <p className="text-on-surface-variant font-medium">Create a moderator account for Quick-Wash.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-10 rounded-[3rem] border border-primary/10 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label text-[10px] font-black uppercase tracking-widest text-primary ml-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  required
                  type="text"
                  placeholder="Admin Name"
                  className="w-full h-16 pl-14 pr-6 bg-surface-container-lowest rounded-2xl border border-primary/5 outline-none focus:border-primary transition-all font-headline font-bold"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] font-black uppercase tracking-widest text-primary ml-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  required
                  type="tel"
                  placeholder="090..."
                  className="w-full h-16 pl-14 pr-6 bg-surface-container-lowest rounded-2xl border border-primary/5 outline-none focus:border-primary transition-all font-headline font-bold"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] font-black uppercase tracking-widest text-primary ml-2">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-16 pl-14 pr-6 bg-surface-container-lowest rounded-2xl border border-primary/5 outline-none focus:border-primary transition-all font-headline font-bold"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-xs font-bold text-center bg-error/10 py-3 rounded-xl">{error}</p>
            )}

            <button 
              disabled={isProcessing}
              className="w-full h-20 signature-gradient text-white rounded-2xl font-headline font-black text-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? 'PROCESSING...' : (
                <>
                  CREATE ADMIN ACCOUNT <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-10 text-on-surface-variant text-sm font-medium">
          Already have an account? <Link href="/auth/login" className="text-primary font-bold">Login here</Link>
        </p>
      </div>
    </div>
  );
}
