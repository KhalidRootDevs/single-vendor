import { Footer } from '@/components/layout/client/footer';
import { Header } from '@/components/layout/client/header';
import { Category } from '@/types';
import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title: 'E-Commerce Platform',
  description: 'A full-featured e-commerce platform with admin panel',
  generator: 'v0.dev'
};

async function getCategoriesTree(): Promise<Category[]> {
  try {
    const response = await fetch(`${process.env.APP_URL}/api/categories/tree`, {
      next: {
        revalidate: 3600, // Revalidate every hour
        tags: ['categories']
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching top categories:', error);
    return [];
  }
}

export default async function ClientLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categoryTree = await getCategoriesTree();

  return (
    <div className="flex min-h-screen flex-col">
      <Header categoryTree={categoryTree} />
      <main className="flex-1 py-2">{children}</main>
      <Footer />
    </div>
  );
}
