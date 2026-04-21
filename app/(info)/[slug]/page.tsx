'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Info, Mail, FileText, Globe, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import TopAppBar from '@/components/shared/TopAppBar';
import Footer from '@/components/shared/Footer';
import Image from 'next/image';

export default function InfoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const content: Record<string, { title: string; icon: any; body: string; image: string }> = {
    contact: {
      title: 'Contact Us',
      icon: Mail,
      body: 'Have questions? Reach out to us at support@quick-wash.com or call +234 800 QUICK WASH. Our team is available 24/7 to assist you with your laundry needs.',
      image: 'https://picsum.photos/seed/laundry-logistics/1920/1080'
    },
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      body: 'Your privacy is our priority. We only collect data necessary to provide our services. We never share your personal information with third parties without your explicit consent.',
      image: 'https://picsum.photos/seed/clean-sheets/1920/1080'
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      body: 'By using Quick-Wash, you agree to our terms. We provide a platform connecting students with laundry vendors. We ensure secure payments and quality service through our Trust Points system.',
      image: 'https://picsum.photos/seed/laundry-basket/1920/1080'
    }
  };

  const pageData = content[slug] || {
    title: 'Information',
    icon: Info,
    body: 'The requested information is currently unavailable.',
    image: 'https://picsum.photos/seed/campus/1920/1080'
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title={pageData.title} showClose onClose={() => router.back()} />
      
      <main className="pt-24 pb-32">
        <header className="relative h-[50vh] w-full overflow-hidden bg-on-surface">
          <Image src={pageData.image} alt={pageData.title} fill className="object-cover opacity-40" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="w-24 h-24 rounded-[2.5rem] signature-gradient flex items-center justify-center shadow-2xl mb-8 mx-auto">
                <pageData.icon className="text-white w-12 h-12" />
              </div>
              <h1 className="text-6xl md:text-8xl font-headline font-black text-white tracking-tighter mb-4">{pageData.title}</h1>
              <p className="text-white/60 text-xl font-medium tracking-widest uppercase">Quick-Wash Official Document</p>
            </motion.div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-[4rem] p-16 shadow-2xl border border-primary/5"
          >
            <div className="prose prose-2xl text-on-surface-variant font-medium leading-relaxed mb-16">
              {pageData.body}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-primary/5">
                <Globe className="w-8 h-8 text-primary mb-4" />
                <h4 className="text-xl font-headline font-black mb-2">Campus Wide</h4>
                <p className="text-on-surface-variant font-medium">Serving the entire student community with high-speed logistics.</p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-secondary/5">
                <Heart className="w-8 h-8 text-secondary mb-4" />
                <h4 className="text-xl font-headline font-black mb-2">Student First</h4>
                <p className="text-on-surface-variant font-medium">Built by students, for students, to solve real problems.</p>
              </div>
            </div>

            <div className="pt-12 border-t border-primary/5 flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-3 text-primary font-headline font-black uppercase tracking-widest text-sm hover:translate-x-[-8px] transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                Return to Previous
              </button>
              <p className="text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Modified: April 2026</p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
