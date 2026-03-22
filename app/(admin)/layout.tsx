'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import type React from 'react';

import AdminHeader from '@/components/layout/admin/header';
import AdminSidebar from '@/components/layout/admin/sidebar';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Check if user has admin role
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'moderator' ||
    user?.role === 'support';

  // Show loading state
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

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      // If no user is logged in, redirect to home
      if (!user) {
        router.push('/');
        return;
      }

      // If user is logged in but doesn't have admin role, redirect to home
      if (user && !isAdmin) {
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, isAdmin, router]);

  // Don't render anything if no user or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="flex-1">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
