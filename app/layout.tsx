import { LoginModal } from '@/components/auth/login-modal';
import { GoogleOneTap } from '@/components/auth/google-one-tap';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { ModalProvider } from '@/context/modal-context';
import { RecentlyViewedProvider } from '@/context/recently-viewed-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-Commerce Platform',
  description: 'A full-featured e-commerce platform with admin panel',
  generator: 'v0.dev'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="white" enableSystem>
          <AuthProvider>
            <ModalProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  <CartProvider>
                    {children}
                    <LoginModal />
                    <GoogleOneTap />
                    <Toaster position="top-right" />
                    <ShadcnToaster />
                  </CartProvider>
                </RecentlyViewedProvider>
              </WishlistProvider>
            </ModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
