'use client';

import type React from 'react';

import { useAuth } from '@/context/auth-context';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Lock,
  Package,
  CreditCard,
  MapPin,
  Settings,
  LogOut,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Profile', href: '/account', icon: User },
  { name: 'Security', href: '/account/security', icon: Lock },
  { name: 'Orders', href: '/account/orders', icon: Package },
  { name: 'Returns', href: '/account/returns', icon: RotateCcw },
  { name: 'Payments', href: '/account/payments', icon: CreditCard },
  { name: 'Addresses', href: '/account/addresses', icon: MapPin },
  { name: 'Settings', href: '/account/settings', icon: Settings }
];

export default function AccountLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthReady, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  // Show a centered spinner while the session check is in flight.
  if (!isAuthReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-secondary'
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </Container>
  );
}
