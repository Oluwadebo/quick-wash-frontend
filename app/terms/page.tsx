'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';

export default function TermsPage() {
  return (
    <div className="pb-32">
      <TopAppBar title="Terms of Service" showClose onClose={() => window.history.back()} />
      
      <main className="pt-28 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-headline font-black mb-8">Terms of Service</h1>
        <div className="prose prose-lg text-on-surface-variant font-medium space-y-6">
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Quick-Wash, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </section>
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">2. User Responsibilities</h2>
            <p>Users are responsible for providing accurate information and ensuring the security of their accounts. Any misuse of the platform may result in account suspension.</p>
          </section>
          <section>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-4">3. Service Limitations</h2>
            <p>Quick-Wash acts as a logistics platform connecting students with vendors. While we strive for excellence, we are not directly liable for damages caused by third-party vendors.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
