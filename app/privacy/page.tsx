'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';

export default function PrivacyPage() {
  return (
    <div className="pb-32">
      <TopAppBar title="Privacy Policy" showClose onClose={() => window.history.back()} />
      
      <main className="pt-28 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-headline font-black mb-8">Privacy Policy</h1>
        <div className="prose prose-lg text-on-surface-variant font-medium space-y-6">
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, phone number, and campus landmark.</p>
          </section>
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, including processing transactions and sending related information like order confirmations and security alerts.</p>
          </section>
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">3. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
