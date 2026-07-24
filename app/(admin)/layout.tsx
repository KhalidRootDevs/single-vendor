'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import type React from 'react';

import AdminHeader from '@/components/layout/admin/header';
import AdminSidebar from '@/components/layout/admin/sidebar';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const ADMIN_ROLES = new Set(['admin', 'moderator', 'support']);

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();

  const isAdmin = !!user && ADMIN_ROLES.has(user.role);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAdmin) {
      router.replace('/admin-login');
    }
  }, [isAuthReady, isAdmin, router]);

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-400">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

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
