'use client';

import React from 'react';
import Link from 'next/link';
import { Droplets, User, Store, Bike, ShieldCheck, ArrowRight, Sparkles, Zap, Shield, Clock, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { api, SiteSettings } from '@/lib/ApiService';

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

import { useAuth } from '@/hooks/use-auth';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'customer' | 'vendor' | 'rider'>('customer');
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [stats, setStats] = React.useState<any>({ 
    customers: 0, 
    vendors: 0, 
    riders: 0, 
    completedOrders: 0,
    featured: [],
    metrics: { avgDelivery: 24, totalVolume: 12000, uptime: '99.9%' }
  });

  React.useEffect(() => {
    api.getSiteSettings().then(setSettings);
    
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin' || user.role === 'super-sub-admin') {
        router.push('/admin');
      } else {
        router.push(`/${user.role === 'customer' ? 'customer' : user.role}`);
      }
    }

    // Fetch live stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch(() => setStats({ 
        customers: 1250, 
        vendors: 28, 
        riders: 52, 
        completedOrders: 15600,
        featured: [
          { shopName: 'Campus Cleans', trustPoints: 950, address: 'Under G Hub' },
          { shopName: 'Laundry King', trustPoints: 880, address: 'Main Gate' },
          { shopName: 'Wash Pros', trustPoints: 820, address: 'Student Union' }
        ],
        metrics: { avgDelivery: 18, totalVolume: 82000, uptime: '99.9%' }
      }));
  }, [router]);

  const howItWorks = {
    customer: [
      { step: '01', title: 'Place Order', desc: 'Select your laundry items and choose your favorite campus vendor.' },
      { step: '02', title: 'Rider Pickup', desc: 'A vetted rider picks up your bag from your hostel door.' },
      { step: '03', title: 'Track & Receive', desc: 'Track the washing process and get it delivered back in 24hrs.' }
    ],
    vendor: [
      { step: '01', title: 'Receive Bags', desc: 'Orders arrive at your shop via our high-speed rider network.' },
      { step: '02', title: 'Clean & Update', desc: 'Wash, dry, and iron. Update status in real-time for the customer.' },
      { step: '03', title: 'Instant Payout', desc: 'Secure your 80% payout as soon as the rider takes the delivery.' }
    ],
    rider: [
      { step: '01', title: 'Claim Task', desc: 'Pick up delivery requests near your location on campus.' },
      { step: '02', title: 'Swift Move', desc: 'Transport bags between hostels and laundry shops safely.' },
      { step: '03', title: 'Earn & Points', desc: 'Get paid per delivery and earn trust points for speed.' }
    ]
  };

  const faqs = [
    { q: 'Is my laundry safe?', a: 'Yes! Every bag is tagged, and every process is tracked from pickup to delivery. All our riders and vendors are vetted campus members.' },
    { q: 'How do I pay?', a: 'Quick-Wash uses a secure in-app wallet. You fund your wallet via transfer, and payment is held in escrow until you receive your clothes.' },
    { q: 'What are Trust Points?', a: 'Trust Points represent your reputation. Reliable users earn points that unlock lower fees, priority service, and elite status badges.' },
    { q: 'How fast is delivery?', a: 'Standard turnaround is 24-48 hours. Many vendors offer "Express" service for same-day delivery (within 6 hours).' }
  ];

  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          >
            <Zap className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* ... (existing login/signup buttons) */}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 bg-primary/5 border border-primary/20 px-4 py-2 rounded-2xl mb-8"
          >
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Online • 24/7 Operations</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-surface overflow-hidden relative">
                  <Image src={`https://picsum.photos/seed/user${i}/100/100`} alt="Active User" fill />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-on-surface-variant">Joined by <span className="text-primary font-black">200+ students</span> today</p>
          </motion.div>

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
              {settings?.logo ? (
                <Image src={settings.logo} alt="Logo" width={48} height={48} className="object-contain" unoptimized />
              ) : (
                <Droplets className="text-white w-12 h-12 fill-current" />
              )}
            </div>
            <h1 
              onClick={() => router.push('/')}
              className="text-6xl font-headline font-black tracking-tighter text-on-surface cursor-pointer"
            >
              {settings?.name || 'Quick-Wash'}
            </h1>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[6rem] md:text-[10rem] leading-[0.82] font-headline font-black text-on-surface mb-12 tracking-tighter max-w-6xl mx-auto"
          >
            The New <span className="text-primary text-vibrant">Fabric</span> of Campus Life.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant font-medium text-2xl max-w-3xl mx-auto leading-relaxed mb-16"
          >
            Express laundry logistics powered by a verified network of student riders and elite campus vendors. Clean clothes, no stress.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-32">
            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5 shadow-sm group hover:border-primary/20 transition-all">
              <h4 className="text-4xl font-headline font-black text-primary mb-1">{stats.completedOrders.toLocaleString()}+</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Completed Washes</p>
            </div>
            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5 shadow-sm group hover:border-primary/20 transition-all">
              <h4 className="text-4xl font-headline font-black text-primary mb-1">{stats.metrics?.avgDelivery || 24}hrs</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Avg. Turnaround</p>
            </div>
            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5 shadow-sm group hover:border-primary/20 transition-all">
              <h4 className="text-4xl font-headline font-black text-primary mb-1">{(stats.metrics?.totalVolume || 12000).toLocaleString()}kg</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Laundry Volume</p>
            </div>
            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-primary/5 shadow-sm group hover:border-primary/20 transition-all">
              <h4 className="text-4xl font-headline font-black text-primary mb-1">{stats.metrics?.uptime || '99.9%'}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">System Uptime</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-12">
            {features.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary transform hover:rotate-12 transition-transform">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="font-headline font-black text-sm">{f.title}</h4>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="py-32 px-6 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-headline font-black mb-4">How it Works</h3>
            <div className="flex justify-center gap-4 bg-surface-container rounded-2xl p-2 w-fit mx-auto">
              {(['customer', 'vendor', 'rider'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={cn(
                    "px-8 py-3 rounded-xl font-headline font-bold text-sm transition-all",
                    activeTab === role ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <AnimatePresence mode="wait">
              {howItWorks[activeTab].map((item, idx) => (
                <motion.div
                  key={`${activeTab}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative p-10 bg-surface rounded-[3rem] border border-primary/5 shadow-xl group hover:border-primary/20 transition-all"
                >
                  <div className="text-6xl font-headline font-black text-primary/10 absolute top-6 right-8 group-hover:text-primary/20 transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-2xl font-headline font-black mb-4 pr-10">{item.title}</h4>
                  <p className="text-on-surface-variant font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Pricing Section - Sample Items */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-headline font-black mb-4 pr-10">Simple, Transparent Pricing</h3>
            <p className="text-on-surface-variant font-medium text-lg">Sample prices from our top vendors. Pay per item, stay within budget.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { item: 'T-Shirt', price: '₦200', icon: '👕' },
              { item: 'Jeans/Trousers', price: '₦400', icon: '👖' },
              { item: 'Duvet (Single)', price: '₦1,500', icon: '🛏️' },
              { item: 'Native/Suit', price: '₦1,000', icon: '🤵' }
            ].map((p, i) => (
              <div key={i} className="bg-surface-container-low p-8 rounded-[2rem] border border-primary/5 text-center hover:scale-105 transition-transform">
                <span className="text-4xl mb-4 block">{p.icon}</span>
                <h5 className="font-headline font-bold text-xl mb-1">{p.item}</h5>
                <p className="text-primary font-black text-2xl">{p.price}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-2">Starting From</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-6 h-auto md:h-[800px]">
             <div className="md:col-span-3 md:row-span-2 bg-surface-container-low rounded-[4rem] p-16 border border-primary/5 flex flex-col justify-end relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Droplets className="w-12 h-12" />
                  </div>
                  <h3 className="text-5xl font-headline font-black mb-6 tracking-tighter">Premium Care for Every Fabric.</h3>
                  <p className="text-xl text-on-surface-variant font-medium leading-relaxed max-w-md">Our vendors utilize best-in-class detergents and professional handling to ensure your clothes return better than ever.</p>
                </div>
             </div>
             <div className="md:col-span-3 bg-surface-container rounded-[3rem] p-12 border border-black/5 flex items-center gap-10 hover:bg-surface-variant transition-colors group">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                  <Bike className="w-10 h-10" />
                </div>
                <div>
                   <h4 className="text-2xl font-headline font-black mb-2">High-Speed Riders</h4>
                   <p className="text-on-surface-variant font-medium">Bags moved across campus in minutes, not hours.</p>
                </div>
             </div>
             <div className="md:col-span-3 bg-tertiary-container rounded-[3rem] p-12 flex items-center gap-10 group">
                <div className="w-20 h-20 rounded-3xl bg-tertiary flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <Star className="w-10 h-10 fill-current" />
                </div>
                <div>
                   <h4 className="text-2xl font-headline font-black mb-2 text-on-tertiary-container">Trust-First Economy</h4>
                   <p className="text-on-tertiary-container/70 font-medium">Earn points, unlock rewards, and build your campus rep.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-headline font-black mb-4">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface p-8 rounded-[2rem] border border-primary/5 shadow-sm">
                <h4 className="text-xl font-headline font-black mb-3">{faq.q}</h4>
                <p className="text-on-surface-variant font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download CTA */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto signature-gradient rounded-[4rem] p-16 relative shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left text-white">
              <h2 className="text-6xl font-headline font-black mb-6 tracking-tighter leading-[0.95]">Ready to wash smarter?</h2>
              <p className="text-white/80 text-xl font-medium mb-10 max-w-xl">
                Download the Quick-Wash app today and join thousands of students getting high-quality laundry service at their doorstep.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button className="px-10 py-5 bg-white text-primary rounded-2xl font-headline font-black text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  App Store
                </button>
                <button className="px-10 py-5 bg-on-surface text-white rounded-2xl font-headline font-black text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                  <Zap className="w-6 h-6" />
                  Google Play
                </button>
              </div>
            </div>
            <div className="flex-1 relative hidden lg:block">
              <div className="w-[320px] h-[640px] bg-on-surface rounded-[3rem] border-[8px] border-white/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-surface flex flex-col p-6">
                  <div className="w-12 h-12 rounded-xl signature-gradient mb-6" />
                  <div className="space-y-4">
                    <div className="h-8 bg-surface-container-highest rounded-full w-full" />
                    <div className="h-8 bg-surface-container-highest rounded-full w-3/4" />
                    <div className="h-40 bg-primary/10 rounded-3xl w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
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

      {/* Values Split Section */}
      <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="p-16 md:p-32 flex flex-col justify-center bg-on-surface text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <Image src="https://picsum.photos/seed/fabric-detail/1200/1200" alt="Fabric" fill className="object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="relative z-10">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="font-label text-xs font-black uppercase tracking-[0.3em] text-primary mb-8"
            >
              Excellence Guaranteed
            </motion.p>
            <h3 className="text-7xl md:text-9xl font-headline font-black mb-12 leading-[0.85] tracking-tighter">
              Professionalism<br/>unmatched on <br/> <span className="text-primary italic">Campus.</span>
            </h3>
            <p className="text-white/60 text-xl font-medium max-w-md leading-relaxed mb-12">
              Every garment handled by our network is treated with precision cleaning technology and high-grade student accountability.
            </p>
            <div className="flex items-center gap-10">
              <div>
                <h5 className="text-4xl font-headline font-black">98.2%</h5>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Satisfaction rate</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <h5 className="text-4xl font-headline font-black">15m</h5>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Avg pickup time</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-16 md:p-32 flex flex-col justify-center bg-surface relative">
           <div className="space-y-24">
              {[
                { title: 'The Escrow Vault', desc: 'Secure payments held until laundry is back in your hands.', icon: ShieldCheck },
                { title: 'Elite Grooming', desc: 'Wash, dry, pressing, and specialized fabric care.', icon: Sparkles },
                { title: 'Real-time Chain', desc: 'Total transparency from hostel door to laundry shop.', icon: Zap }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-10 items-start group"
                >
                  <div className="w-20 h-20 rounded-[2rem] bg-surface-container flex items-center justify-center text-primary shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-primary/5">
                    <item.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-headline font-black mb-4">{item.title}</h4>
                    <p className="text-on-surface-variant font-medium text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="py-48 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-headline font-black mb-4">Community Top Stars</h3>
            <p className="text-on-surface-variant font-medium text-lg">Real members building trust and delivering excellence.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-12">
            {(stats.featured && stats.featured.length > 0 ? stats.featured : [
              { shopName: 'Campus Cleans', trustPoints: 950, address: 'Under G Hub', type: 'vendor' },
              { shopName: 'Laundry King', trustPoints: 880, address: 'Main Gate', type: 'vendor' }
            ]).map((feat: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={cn(
                  "flex-1 rounded-[3rem] p-12 border shadow-xl relative overflow-hidden group",
                  i === 0 ? "bg-surface-container-low border-primary/5" : "bg-surface-container-low border-tertiary/5"
                )}
              >
                <div className={cn(
                  "absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700",
                  i === 0 ? "bg-primary/5" : "bg-tertiary/5"
                )} />
                <p className={cn(
                  "font-label text-xs font-black uppercase tracking-[0.2em] mb-6",
                  i === 0 ? "text-primary" : "text-tertiary"
                )}>Top Vendor Spotlight</p>
                <div className="flex items-center gap-8 mb-8">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden relative shadow-2xl">
                    <Image src={`https://picsum.photos/seed/shop${i}/200/200`} alt="Featured Shop" fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-headline font-black text-on-surface">{feat.shopName || feat.fullName}</h3>
                    <p className="text-on-surface-variant font-medium">{feat.address} • {feat.trustPoints} Trust Points</p>
                  </div>
                </div>
                <p className="text-on-surface-variant font-medium text-lg leading-relaxed italic">
                  &quot;{feat.shopName ? 'Quick-Wash has transformed how I manage my laundry business. The Trust Points system keeps my customers coming back!' : 'I love the speed and reliability of this network. It makes campus life so much easier.'}&quot;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-32 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="flex-1">
              <h2 className="text-6xl font-headline font-black text-on-surface mb-8 tracking-tighter leading-[0.95]">
                Built for campus, <span className="text-primary text-vibrant">secured for you.</span>
              </h2>
              <div className="space-y-8">
                {[
                  { icon: ShieldCheck, title: 'Identity Verified', desc: 'Every vendor and rider undergoes a strict campus identity verification process.' },
                  { icon: Shield, title: 'Payment Escrow', desc: 'Your money stays in our secure vault until you confirm you have your clean clothes.' },
                  { icon: Droplets, title: 'Quality Guarantee', desc: 'If your laundry is not cleaned to standard, our support team mediates a resolution.' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 p-6 rounded-3xl hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-headline font-black mb-2">{item.title}</h4>
                      <p className="text-on-surface-variant font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
              <div className="relative bg-surface-container-low rounded-[4rem] p-4 shadow-2xl border border-primary/5">
                <div className="bg-surface rounded-[3.5rem] overflow-hidden aspect-[4/5] relative">
                  <Image src="https://picsum.photos/seed/safety/800/1000" alt="Safety First" fill className="object-cover opacity-80" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12">
                    <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h5 className="text-xl font-headline font-black">Escrow Secured</h5>
                      </div>
                      <p className="text-on-surface-variant font-medium text-sm">Payment released to Campus Cleans only after your approval.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <div className="w-20 h-20 rounded-full bg-surface-variant overflow-hidden">
                  <Image src="https://picsum.photos/seed/alex/200/200" alt="Alex" width={80} height={80} className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="text-2xl font-headline font-black">Alex Thompson</h4>
                  <p className="text-primary font-black text-sm uppercase tracking-widest">Elite Member • 820 Points</p>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Wash Progress</span>
                    <span className="text-xs font-black text-primary">In Delivery</span>
                  </div>
                  <div className="h-4 bg-surface-container-highest rounded-full w-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '85%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full signature-gradient" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Next Reward</h6>
                    <p className="font-headline font-black text-lg">15% Discount</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Status</h6>
                    <p className="font-headline font-black text-lg text-tertiary">Verified Elite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
