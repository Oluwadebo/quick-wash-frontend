'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Droplets, ShieldCheck, User, Lock, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { API_URLS } from '@/lib/api-config';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

export default function AdminFinishPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center font-headline font-black">Loading Setup...</div>}>
      <AdminFinishPageContent />
    </Suspense>
  );
}

function AdminFinishPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [invite, setInvite] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    phoneNumber: '',
    email: '',
    password: '',
    fullName: ''
  });

  React.useEffect(() => {
    if (!token) return;
    const fetchInvite = async () => {
      try {
        const resp = await fetch(`${API_URLS.base}/admin/invite/verify?token=${token}`);
        if (resp.ok) {
          const data = await resp.json();
          setInvite(data);
          setFormData(prev => ({ 
            ...prev, 
            fullName: data.fullName,
            email: data.email || '' // Pre-fill email from invite data
          }));
        } else {
          const err = await resp.json();
          alert(err.message || 'Invite link has expired or is invalid.');
          router.push('/auth');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_URLS.base}/admin/invite/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.token) {
          localStorage.setItem('qw_token', data.token);
          // Success state will be handled below (invite becomes null)
        }
        setInvite(null); 
        setLoading(false);
      } else {
        const data = await resp.json();
        alert(data.message || 'Failed to complete registration.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center font-headline font-black">Validating Invite...</div>;
  if (!invite && !loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-success flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-headline font-black text-on-surface mb-4 uppercase italic">Setup Complete</h1>
          <p className="text-on-surface-variant font-medium mb-8">Your admin account has been created and activated. You now have full access to the management console.</p>
          <button 
            onClick={() => router.push('/admin')}
            className="w-full h-16 bg-primary text-on-primary rounded-2xl font-headline font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            GO TO DASHBOARD
          </button>
        </motion.div>
      </div>
    );
  }
  if (!invite) return null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-tertiary/5 rounded-full blur-3xl -ml-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl signature-gradient flex items-center justify-center shadow-lg">
            <Droplets className="text-white w-8 h-8 fill-current" />
          </div>
        </div>

        <h1 className="text-3xl font-headline font-black text-on-surface text-center mb-2 tracking-tighter uppercase italic">Finish Admin Setup</h1>
        <p className="text-on-surface-variant text-center font-medium mb-8">Role: <span className="text-primary font-black uppercase tracking-widest">{invite.role}</span></p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Full Name (Locked)</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-50" />
              <input 
                type="text" 
                value={formData.fullName}
                disabled
                className="w-full h-16 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none border border-primary/5 cursor-not-allowed opacity-50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-50" />
              <input 
                type="tel" 
                required
                placeholder="070..."
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full h-16 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">{invite.email ? 'Professional Email (Locked)' : 'Professional Email'}</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-50" />
              <input 
                type="email" 
                required
                placeholder="admin@quickwash.app"
                value={formData.email}
                disabled={!!invite.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  "w-full h-16 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5",
                  invite.email && "cursor-not-allowed opacity-50"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-50" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-16 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-20 bg-primary text-on-primary rounded-3xl font-headline font-black text-lg shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            COMPLETE SETUP
            <ShieldCheck className="w-6 h-6" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
