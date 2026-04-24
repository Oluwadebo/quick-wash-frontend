'use client';

import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Sidebar from "@/components/shared/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </ProtectedRoute>
  );
}
