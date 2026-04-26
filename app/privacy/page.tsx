'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Shield, Lock, Eye, Server, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Footer from '@/components/shared/Footer';
import { cn } from '@/lib/utils';

export default function PrivacyPage() {
  const sections = [
    { 
      id: 'collect', 
      title: '1. Information Collection', 
      icon: Eye, 
      summary: 'We only ask for what we need to wash your clothes.',
      content: 'We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, phone number, campus hostel, and specific laundry preferences.' 
    },
    { 
      id: 'use', 
      title: '2. Data Usage', 
      icon: CheckCircle2, 
      summary: 'Your hostel location stays within our logistics network.',
      content: 'We use the information we collect to provide, maintain, and improve our services. This includes processing transactions, identifying local riders near your hostel, and ensuring vendors meet our quality standards.' 
    },
    { 
      id: 'security', 
      title: '3. Security Protocols', 
      icon: Shield, 
      summary: 'Encryption is active on every transaction.',
      content: 'We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. All transaction data is encrypted and stored on secure campus-adjacent servers.' 
    },
    { 
      id: 'storage', 
      title: '4. Third-Party Sharing', 
      icon: Server, 
      summary: 'No data is sold. Period.',
      content: 'We only share information with riders and vendors who are actively fulfilling your logistics requests. No data is sold to external advertisers.' 
    }
  ];

  const [activeSection, setActiveSection] = React.useState(sections[0].id);

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title="Privacy & Trust" showClose onClose={() => window.history.back()} />
      
      <main className="pt-24">
        {/* Editorial Header */}
        <header className="py-32 px-6 relative overflow-hidden bg-on-surface text-white">
          <div className="absolute inset-0 opacity-20">
            <Image 
              src="https://picsum.photos/seed/clean-sheets/1920/1080" 
              alt="Clean Fabric" 
              fill 
              className="object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-8 shadow-2xl shadow-primary/40"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-7xl md:text-[9rem] font-headline font-black leading-[0.8] mb-12 tracking-tighter">
              Privacy as a <br/> <span className="text-primary">Standard.</span>
            </h1>
            <p className="text-white/60 text-2xl font-medium max-w-2xl leading-relaxed">
              At Quick-Wash, we believe logistics is nothing without trust. This policy outlines exactly how we handle your campus data.
            </p>
          </div>
        </header>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Sticky Nav */}
          <aside className="lg:col-span-4 self-start sticky top-32 hidden lg:block">
            <div className="space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "w-full text-left p-6 rounded-2xl font-headline font-black text-sm uppercase tracking-widest transition-all flex items-center justify-between group",
                    activeSection === s.id ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  {s.title.split('. ')[1]}
                  <ArrowRight className={cn("w-5 h-5 transition-transform", activeSection === s.id ? "translate-x-0" : "-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                </button>
              ))}
            </div>
          </aside>

          {/* Main Body */}
          <div className="lg:col-span-8 space-y-32">
            {sections.map((s) => (
              <motion.section 
                id={s.id}
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                onViewportEnter={() => setActiveSection(s.id)}
                className="space-y-8"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary border border-primary/5 shadow-sm">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-headline font-black mb-1">{s.title}</h2>
                    <p className="text-primary font-black text-xs uppercase tracking-widest">{s.summary}</p>
                  </div>
                </div>
                <div className="prose prose-2xl text-on-surface-variant font-medium leading-relaxed max-w-none">
                  {s.content}
                </div>
                <div className="h-1 w-20 bg-surface-container rounded-full" />
              </motion.section>
            ))}

            <div className="bg-surface-container-low rounded-[3rem] p-12 border border-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-2xl font-headline font-black mb-6">Need more clarity?</h3>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed mb-8">
                If you have questions about your data or want to request a deletion, our campus privacy officer is available via email.
              </p>
              <button className="px-10 py-5 signature-gradient text-white rounded-2xl font-headline font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                Contact Privacy Officer
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
