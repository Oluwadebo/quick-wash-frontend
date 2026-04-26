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
import Footer from '@/components/shared/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased">
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
