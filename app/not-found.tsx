import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
        <Search className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-6xl font-headline font-black text-on-surface mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">Oops! Page not found.</h2>
      <p className="text-on-surface-variant max-w-md mb-10 font-medium">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        className="h-16 px-8 bg-primary text-on-primary rounded-2xl font-headline font-black flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
      >
        <Home className="w-5 h-5" />
        BACK TO HOME
      </Link>
    </div>
  );
}
