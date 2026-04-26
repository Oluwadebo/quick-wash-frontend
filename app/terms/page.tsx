'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Scale, FileText, UserCheck, AlertTriangle, ArrowRight, Gavel, Handshake } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Footer from '@/components/shared/Footer';
import { cn } from '@/lib/utils';

export default function TermsPage() {
  const sections = [
    { 
      id: 'acceptance', 
      title: '1. Acceptance of Terms', 
      icon: Handshake, 
      summary: 'Using the app means you agree to our rules.',
      content: 'By accessing or using Quick-Wash, you agree to be bound by these Terms of Service. If you are under 18, you must have parental consent to use our campus logistics features.' 
    },
    { 
      id: 'responsibilities', 
      title: '2. User Responsibilities', 
      icon: UserCheck, 
      summary: 'Be honest and protect your codes.',
      content: 'Users are responsible for providing accurate hostel information and ensuring the security of their handover codes. Misuse of the platform or fraudulent activity will result in immediate campus-wide suspension.' 
    },
    { 
      id: 'limitations', 
      title: '3. Service Limitations', 
      icon: AlertTriangle, 
      summary: 'We facilitate trust, vendors deliver results.',
      content: 'Quick-Wash acts as a logistics intermediary. While we vet all vendors and riders, we are not directly liable for specific laundry damages. We provide a dispute resolution tool through our Trust Points system.' 
    },
    { 
      id: 'termination', 
      title: '4. Account Termination', 
      icon: Gavel, 
      summary: 'Play fair or lose access.',
      content: 'We reserve the right to terminate accounts that violate our community standards or fail to pay for services rendered across the network.' 
    }
  ];

  const [activeTab, setActiveTab] = React.useState(sections[0].id);

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title="Community Rules" showClose onClose={() => window.history.back()} />
      
      <main className="pt-24">
        {/* Editorial Header */}
        <header className="py-32 px-6 relative overflow-hidden bg-on-surface text-white">
          <div className="absolute inset-0 opacity-20">
            <Image 
              src="https://picsum.photos/seed/laundry-basket/1920/1080" 
              alt="Linen Care" 
              fill 
              className="object-cover scale-110" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 rounded-3xl bg-tertiary flex items-center justify-center mb-8 shadow-2xl shadow-tertiary/40"
            >
              <Scale className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-7xl md:text-[9rem] font-headline font-black leading-[0.8] mb-12 tracking-tighter">
              Rules of the <br/> <span className="text-tertiary">Network.</span>
            </h1>
            <p className="text-white/60 text-2xl font-medium max-w-2xl leading-relaxed">
              Transparent rules for a fair campus logistics ecosystem. Please read our terms carefully before placing your first order.
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
                    setActiveTab(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "w-full text-left p-6 rounded-2xl font-headline font-black text-sm uppercase tracking-widest transition-all flex items-center justify-between group text-on-surface-variant",
                    activeTab === s.id ? "bg-tertiary text-white shadow-xl shadow-tertiary/20" : "hover:bg-surface-container"
                  )}
                >
                  {s.title.split('. ')[1]}
                  <ArrowRight className={cn("w-5 h-5 transition-transform", activeTab === s.id ? "translate-x-0" : "-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
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
                onViewportEnter={() => setActiveTab(s.id)}
                className="space-y-8"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-tertiary border border-tertiary/5 shadow-sm">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-headline font-black mb-1">{s.title}</h2>
                    <p className="text-tertiary font-black text-xs uppercase tracking-widest">{s.summary}</p>
                  </div>
                </div>
                <div className="prose prose-2xl text-on-surface-variant font-medium leading-relaxed max-w-none">
                  {s.content}
                </div>
                <div className="h-1 w-20 bg-surface-container rounded-full" />
              </motion.section>
            ))}

            <div className="bg-surface-container-low rounded-[3rem] p-12 border border-tertiary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-2xl font-headline font-black mb-6">Agreement Update</h3>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed mb-8">
                These terms were last updated on April 20, 2026. Continued use of the platform after updates constitutes acceptance of the new terms.
              </p>
              <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-on-surface-variant">
                <FileText className="w-5 h-5" />
                Version 2.4.1 (Campus Edition)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
