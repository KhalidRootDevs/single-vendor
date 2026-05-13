'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import type React from 'react';

import AdminHeader from '@/components/layout/admin/header';
import AdminSidebar from '@/components/layout/admin/sidebar';
import { useAuth } from '@/context/auth-context';
import { UNAUTHORIZED_EVENT } from '@/lib/api-fetch';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Intercept all fetch calls in the admin panel.
  // Any 401 response dispatches UNAUTHORIZED_EVENT → auth-context handles logout + redirect.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'moderator' ||
    user?.role === 'support';

  // Only redirect after auth check is complete (isLoading = false)
  useEffect(() => {
    if (isLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
    }
  }, [isLoading, user, isAdmin, router]);

  // Show loading while auth check is in flight
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" />
          <p className="text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Auth settled — not an admin, redirect is in flight
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
