import type { MetadataRoute } from 'next';
import connectDB from '@/lib/database';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    }
  ];

  try {
    await connectDB();

    const [products, categories] = await Promise.all([
      Product.find({ active: true }).select('_id updatedAt').lean(),
      Category.find({ active: true }).select('_id slug updatedAt').lean()
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/products/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt as Date) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${BASE_URL}/categories?id=${c._id}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt as Date) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
