'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Mail, Phone, MapPin, MessageCircle, Clock, Globe, ArrowRight, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { API_URLS } from '@/lib/api-config';
import Footer from '@/components/shared/Footer';

export default function ContactPage() {
  const [formState, setFormState] = React.useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URLS.base}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      
      const data = await res.json();
      if (data.success) {
        setIsSent(true);
        setFormState({ name: '', email: '', message: '' });
        setTimeout(() => setIsSent(false), 5000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title="Support Hub" showClose onClose={() => window.history.back()} />
      
      <main className="pt-24 pb-32">
        {/* Banner Section */}
        <section className="relative h-[400px] w-full overflow-hidden mb-20">
          <Image 
            src="https://picsum.photos/seed/laundry-logistics/1920/1080" 
            alt="Laundry Logistics" 
            fill 
            className="object-cover brightness-[0.4]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full mb-8 text-white/90 font-headline font-black text-xs uppercase tracking-widest"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Support Online
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-headline font-black text-white mb-6 tracking-tighter"
              >
                How can we <span className="text-primary text-vibrant">help you?</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/70 text-xl font-medium max-w-2xl mx-auto"
              >
                Expect a response within 15 minutes during campus operational hours.
              </motion.p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Info */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-headline font-black text-on-surface">Campus Operations</h2>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed">
                Our team is stationed at the Student Union Building to ensure your laundry logistics run smoothly 24/7.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Mail, label: 'Email Support', value: 'support@quickwash.campus', color: 'text-primary bg-primary/10' },
                { icon: Phone, label: 'Hotline', value: '+234 800 QUICK WASH', color: 'text-tertiary bg-tertiary/10' },
                { icon: MapPin, label: 'Headquarters', value: 'SUB Floor 2, Room 402', color: 'text-secondary bg-secondary/10' },
                { icon: Clock, label: 'Response Time', value: 'Typically UNDER 15m', color: 'text-[#F27D26] bg-[#F27D26]/10' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 flex items-center gap-6 group hover:border-primary/20 transition-all shadow-sm"
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{item.label}</p>
                    <p className="text-lg font-headline font-black">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-10 border border-primary/10">
              <h3 className="text-xl font-headline font-black mb-4 flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Network Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-on-surface-variant">Rider Availability</span>
                  <span className="text-emerald-500">High (42 Active)</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]" />
                </div>
                <p className="text-xs text-on-surface-variant font-medium italic">
                  *Delivery times are currently faster than usual.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 bg-surface-container-low rounded-[3.5rem] p-12 border border-primary/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-4xl font-headline font-black mb-4">Send a Message</h2>
              <p className="text-on-surface-variant font-medium text-lg mb-10">Have a specific request or reporting an issue? Fill out the form below.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold animate-shake">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
                    <input 
                      required
                      className="w-full bg-surface-container-highest px-8 py-5 rounded-2xl font-headline font-bold text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                      placeholder="Alex Campus"
                      value={formState.name}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-surface-container-highest px-8 py-5 rounded-2xl font-headline font-bold text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                      placeholder="alex@uni.com"
                      value={formState.email}
                      onChange={e => setFormState({...formState, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Your Message</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full bg-surface-container-highest px-8 py-5 rounded-2xl font-headline font-bold text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 ring-primary/20 transition-all border border-transparent focus:border-primary/20 resize-none"
                    placeholder="How can we help you solve your logistics issue?"
                    value={formState.message}
                    onChange={e => setFormState({...formState, message: e.target.value})}
                  />
                </div>

                <button 
                  disabled={isSending || isSent}
                  className={cn(
                    "w-full py-6 rounded-2xl font-headline font-black text-xl flex items-center justify-center gap-3 transition-all",
                    isSent ? "bg-emerald-500 text-white" : 
                    isSending ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" :
                    "signature-gradient text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {isSent ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 animate-bounce" />
                      Message Sent!
                    </>
                  ) : isSending ? (
                    <>
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <section className="mt-32 px-6">
          <div className="max-w-7xl mx-auto rounded-[3.5rem] bg-on-surface p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
            <Image 
              src="https://picsum.photos/seed/washing-machine/800/400" 
              alt="Live Chat" 
              fill 
              className="object-cover opacity-20 absolute inset-0 pointer-events-none" 
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10">
              <h2 className="text-5xl font-headline font-black text-white mb-4 tracking-tighter">Instant WhatsApp Support</h2>
              <p className="text-white/70 text-xl font-medium">Bypass the form and chat with a logistics specialist now.</p>
            </div>
            <button className="relative z-10 px-12 py-6 bg-emerald-500 text-white rounded-2xl font-headline font-black text-xl shadow-2xl shadow-emerald-500/20 flex items-center gap-4 hover:scale-105 transition-transform active:scale-95">
              <MessageCircle className="w-8 h-8 fill-current" />
              Open WhatsApp
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
