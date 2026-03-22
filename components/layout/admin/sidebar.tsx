'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';

import { useAuth } from '@/context/auth-context';
import {
  BarChart3,
  Box,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Users
} from 'lucide-react';

const sidebarConfig = [
  {
    label: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3
      }
    ]
  },
  {
    label: 'Store Management',
    items: [
      {
        title: 'Products',
        href: '/admin/products',
        icon: Package
      },
      {
        title: 'Categories',
        href: '/admin/categories',
        icon: Box
      },
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users
      }
    ]
  },

  {
    label: 'Order Management',
    items: [
      {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingBag
      },
      {
        title: 'Payments',
        href: '/admin/payments',
        icon: DollarSign
      }
    ]
  },
  {
    label: 'Content',
    items: [
      {
        title: 'Contact Submissions',
        href: '/admin/contact-submissions',
        icon: MessageSquare
      },
      {
        title: 'Banners',
        href: '/admin/banners',
        icon: LayoutDashboard
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings
      }
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xl font-bold">OneVendor</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarConfig.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 rounded-md border px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium">Admin User</div>
              <div className="truncate text-xs text-muted-foreground">
                admin@example.com
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
