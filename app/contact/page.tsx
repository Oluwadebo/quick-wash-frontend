'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ContactPage() {
  return (
    <div className="pb-32">
      <TopAppBar title="Contact Us" showClose onClose={() => window.history.back()} />
      
      <main className="pt-28 px-6 max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-headline font-black text-on-surface mb-4">Get in Touch</h1>
          <p className="text-on-surface-variant font-medium text-xl">We&apos;re here to help you with any questions or issues.</p>
        </header>

        <div className="space-y-6">
          {[
            { icon: Mail, label: 'Email Support', value: 'support@quickwash.campus', color: 'bg-primary/10 text-primary' },
            { icon: Phone, label: 'Call Us', value: '+234 800 QUICK WASH', color: 'bg-secondary/10 text-secondary' },
            { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us live', color: 'bg-tertiary/10 text-tertiary' },
            { icon: MapPin, label: 'Office', value: 'Student Union Building, Floor 2', color: 'bg-surface-container-highest text-on-surface' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5 flex items-center gap-6"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{item.label}</p>
                <p className="text-xl font-headline font-black">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
