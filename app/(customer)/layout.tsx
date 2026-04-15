'use client';

import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Sidebar from "@/components/shared/Sidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
