'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Info, Mail, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import TopAppBar from '@/components/shared/TopAppBar';

export default function InfoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const content: Record<string, { title: string; icon: any; body: string }> = {
    contact: {
      title: 'Contact Us',
      icon: Mail,
      body: 'Have questions? Reach out to us at support@quick-wash.com or call +234 800 QUICK WASH. Our team is available 24/7 to assist you with your laundry needs.'
    },
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      body: 'Your privacy is our priority. We only collect data necessary to provide our services. We never share your personal information with third parties without your explicit consent.'
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      body: 'By using Quick-Wash, you agree to our terms. We provide a platform connecting students with laundry vendors. We ensure secure payments and quality service through our Trust Points system.'
    }
  };

  const pageData = content[slug] || {
    title: 'Information',
    icon: Info,
    body: 'The requested information is currently unavailable.'
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title={pageData.title} />
      
      <main className="pt-32 px-6 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low rounded-[3rem] p-12 border border-primary/5 shadow-sm"
        >
          <div className="w-20 h-20 rounded-[2rem] signature-gradient flex items-center justify-center shadow-xl mb-8">
            <pageData.icon className="text-white w-10 h-10" />
          </div>
          
          <h2 className="text-4xl font-headline font-black mb-6 tracking-tighter">{pageData.title}</h2>
          <p className="text-on-surface-variant font-medium text-xl leading-relaxed">
            {pageData.body}
          </p>
          
          <div className="mt-12 pt-12 border-t border-primary/5">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-3 text-primary font-headline font-black uppercase tracking-widest text-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
