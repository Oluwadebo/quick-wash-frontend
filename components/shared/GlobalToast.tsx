'use client';

import React from 'react';
import { Toast } from './Toast';
import { AnimatePresence } from 'motion/react';

export default function GlobalToast() {
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  React.useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 5000);
    };

    window.addEventListener('toast_notification', handleToast);
    return () => window.removeEventListener('toast_notification', handleToast);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}
    </AnimatePresence>
  );
}
