'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth?login=true');
      } else if (user.status === 'suspended') {
        router.push('/suspended');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if they try to access a wrong role page
        router.push(`/${user.role === 'customer' ? 'customer' : user.role}`);
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-headline font-bold text-on-surface-variant">Verifying Access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
