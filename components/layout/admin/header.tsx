'use client';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6 lg:px-8">
      <SidebarTrigger />
      <Container className="flex flex-1 items-center justify-between">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              View Store
            </Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
