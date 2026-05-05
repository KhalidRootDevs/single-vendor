import { Footer } from '@/components/layout/client/footer';
import { Header } from '@/components/layout/client/header';
import connectDB from '@/lib/database';
import { Category as CategoryModel } from '@/models/Category';
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
    await connectDB();
    const categories = await CategoryModel.find({ parentId: null })
      .sort({ order: 1, name: 1 })
      .populate({
        path: 'subCategories',
        options: { sort: { order: 1, name: 1 } },
        populate: {
          path: 'subCategories',
          options: { sort: { order: 1, name: 1 } }
        }
      })
      .lean();
    return categories as unknown as Category[];
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
