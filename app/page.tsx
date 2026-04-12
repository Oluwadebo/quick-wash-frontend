'use client';

import React from 'react';
import Link from 'next/link';
import { Droplets, User, Store, Bike, ShieldCheck, ArrowRight, Sparkles, Zap, Shield, Clock, MapPin, Star } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const roles = [
  { 
    title: 'Customer', 
    desc: 'Get your laundry done with zero stress. We pick up from your hostel.', 
    href: '/customer', 
    icon: User, 
    color: 'bg-primary-container text-on-primary-container',
    gradient: 'from-primary/20 to-primary/5',
    tag: 'Student Favorite'
  },
  { 
    title: 'Vendor', 
    desc: 'Professional laundry? Join our network and grow your campus business.', 
    href: '/vendor', 
    icon: Store, 
    color: 'bg-tertiary-container text-on-tertiary-container',
    gradient: 'from-tertiary/20 to-tertiary/5',
    tag: 'Business Growth'
  },
  { 
    title: 'Rider', 
    desc: 'Earn money on your own schedule. Deliver clean laundry across campus.', 
    href: '/rider', 
    icon: Bike, 
    color: 'bg-secondary-container text-on-secondary-container',
    gradient: 'from-secondary/20 to-secondary/5',
    tag: 'Earn Daily'
  }
];

const features = [
  { icon: Clock, title: 'Express Service', desc: 'Clean laundry back in 6 hours' },
  { icon: Shield, title: 'Escrow Payment', desc: 'Vendor paid only after you confirm' },
  { icon: MapPin, title: 'Hostel Pickup', desc: 'No more carrying heavy bags' },
  { icon: Star, title: 'Trust Points', desc: 'Earn rewards for every wash' }
];

export default function LandingPage() {
  const router = useRouter();

  React.useEffect(() => {
    const storedUser = localStorage.getItem('qw_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      router.push(`/${user.role === 'customer' ? 'customer' : user.role}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <header className="relative pt-24 pb-32 px-6 overflow-hidden">
        <div className="absolute top-6 right-6 flex gap-4 z-50">
          <Link 
            href="/auth?role=customer&login=true"
            className="px-6 py-3 bg-white/80 backdrop-blur-md rounded-xl font-headline font-black text-sm text-primary shadow-sm active:scale-95 transition-all"
          >
            Login
          </Link>
          <button 
            onClick={() => window.scrollTo({ top: document.getElementById('roles')?.offsetTop, behavior: 'smooth' })}
            className="px-6 py-3 signature-gradient rounded-xl font-headline font-black text-sm text-white shadow-lg active:scale-95 transition-all"
          >
            Sign Up
          </button>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent -z-10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <div 
              onClick={() => router.push('/')}
              onContextMenu={(e) => { e.preventDefault(); router.push('/admin'); }}
              className="w-20 h-20 rounded-[2rem] signature-gradient flex items-center justify-center shadow-2xl shadow-primary/20 cursor-pointer active:scale-95 transition-transform"
            >
              <Droplets className="text-white w-12 h-12 fill-current" />
            </div>
            <h1 
              onClick={() => router.push('/')}
              className="text-6xl font-headline font-black tracking-tighter text-on-surface cursor-pointer"
            >
              Quick-Wash
            </h1>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[5rem] leading-[0.9] font-headline font-black text-on-surface mb-8 tracking-tighter max-w-4xl mx-auto"
          >
            Laundry logistics for the <span className="text-primary">Modern Campus.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant font-medium text-2xl max-w-2xl mx-auto leading-relaxed mb-16"
          >
            The fastest, most secure way to get your laundry done. From your hostel door to the best campus vendors.
          </motion.p>

          <div className="flex flex-wrap justify-center gap-12">
            {features.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="font-headline font-black text-sm">{f.title}</h4>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* Role Selection / Signup */}
      <section id="roles" className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-headline font-black mb-4">Join the Network</h3>
            <p className="text-on-surface-variant font-medium text-lg">Choose your role to get started with Quick-Wash</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role, idx) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link 
                  href={`/auth?role=${role.title.toLowerCase()}`}
                  className="group relative block h-full bg-surface-container-low rounded-[3rem] p-10 border border-primary/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl ${role.color}`}>
                        <role.icon className="w-10 h-10 fill-current" />
                      </div>
                      <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                        {role.tag}
                      </span>
                    </div>

                    <h3 className="text-3xl font-headline font-black text-on-surface mb-4 flex items-center gap-2">
                      {role.title}
                      <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </h3>
                    <p className="text-on-surface-variant font-medium text-lg leading-relaxed mb-10 flex-grow">
                      {role.desc}
                    </p>

                    <div className="signature-gradient text-white py-5 rounded-2xl font-headline font-black text-center shadow-lg shadow-primary/20 group-hover:scale-[1.02] transition-transform">
                      Get Started as {role.title}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Points Section */}
      <section className="bg-surface-container-highest/30 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <div className="inline-flex items-center gap-3 bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full mb-8 shadow-lg">
              <Zap className="w-6 h-6 fill-current" />
              <span className="font-headline font-black text-sm uppercase tracking-widest">Trust Points System</span>
            </div>
            <h2 className="text-6xl font-headline font-black text-on-surface mb-8 tracking-tighter leading-[0.95]">
              The more you wash, the <span className="text-tertiary">more you earn.</span>
            </h2>
            <p className="text-on-surface-variant font-medium text-xl leading-relaxed mb-12">
              Our unique Trust Points system rewards reliable customers and vendors. Earn points for every successful handover and unlock priority service, discounts, and &quot;Elite&quot; status badges.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl">
                <h4 className="text-4xl font-headline font-black text-primary mb-2">5.0</h4>
                <p className="font-label text-xs font-black uppercase tracking-widest text-on-surface-variant">Avg. Vendor Rating</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl">
                <h4 className="text-4xl font-headline font-black text-tertiary mb-2">12k+</h4>
                <p className="font-label text-xs font-black uppercase tracking-widest text-on-surface-variant">Happy Students</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <div className="relative bg-surface-container-low rounded-[4rem] p-12 shadow-2xl border border-primary/5">
              {/* Mock Dashboard Preview */}
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-full bg-surface-variant" />
                <div>
                  <h4 className="text-2xl font-headline font-black">Alex Thompson</h4>
                  <p className="text-primary font-black text-sm uppercase tracking-widest">Elite Member • 820 Points</p>
                </div>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-surface-container-highest rounded-full w-full" />
                ))}
                <div className="h-4 bg-primary rounded-full w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-24 px-6 border-t-2 border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Droplets className="text-primary w-8 h-8 fill-current" />
            <span className="text-2xl font-headline font-black tracking-tighter">Quick-Wash</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <Link href="/contact" className="text-on-surface-variant font-bold hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/privacy" className="text-on-surface-variant font-bold hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-on-surface-variant font-bold hover:text-primary transition-colors">Terms of Service</Link>
            <Link 
              href="/admin"
              className="text-on-surface-variant font-bold hover:text-primary transition-colors opacity-10"
            >
              Admin
            </Link>
          </div>

          <p className="font-label text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40 text-center">
            Built for the Modern Campus • 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
