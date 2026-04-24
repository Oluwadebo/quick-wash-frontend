import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '600', '700', '800'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-label',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Quick-Wash | Premium Campus Laundry',
  description: 'The kinetic laundry experience for modern students.',
};

import BottomNav from '@/components/shared/BottomNav';
import Sidebar from '@/components/shared/Sidebar';
import { Suspense } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased">
        <div className="flex min-h-screen">
          <Suspense fallback={<div className="w-72 hidden lg:block" />}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 w-full lg:max-w-[calc(100vw-18rem)]">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
