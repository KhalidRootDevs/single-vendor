import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import connectDB from '@/lib/database';
import { Category as CategoryModel } from '@/models/Category';
import { Category } from '@/types';

async function getFeaturedCategories(): Promise<Category[]> {
  try {
    await connectDB();
    const categories = await CategoryModel.find({
      featured: true,
      active: true,
      parentId: null
    })
      .sort({ order: 1, name: 1 })
      .limit(8)
      .lean();
    return categories as unknown as Category[];
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    return [];
  }
}

export async function TopCategories() {
  const categories = await getFeaturedCategories();

  // Fallback to default categories if DB fails or returns empty
  const displayCategories =
    categories.length > 0
      ? categories
      : [
          {
            _id: 'clothing',
            name: 'Clothing',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Stylish apparel for every occasion',
            slug: 'clothing',
            featured: true,
            active: true
          },
          {
            _id: 'electronics',
            name: 'Electronics',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Latest gadgets and tech accessories',
            slug: 'electronics',
            featured: true,
            active: true
          },
          {
            _id: 'home',
            name: 'Home & Kitchen',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Everything for your living space',
            slug: 'home-kitchen',
            featured: true,
            active: true
          },
          {
            _id: 'accessories',
            name: 'Accessories',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Complete your look with our accessories',
            slug: 'accessories',
            featured: true,
            active: true
          },
          {
            _id: 'footwear',
            name: 'Footwear',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Comfortable and stylish shoes',
            slug: 'footwear',
            featured: true,
            active: true
          },
          {
            _id: 'beauty',
            name: 'Beauty',
            image: '/placeholder.svg?height=300&width=300',
            description: 'Skincare, makeup and personal care',
            slug: 'beauty',
            featured: true,
            active: true
          }
        ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {displayCategories.map((category) => (
        <Link
          key={category._id}
          href={`/products?categories=${category.slug}`}
          className="block transition-transform hover:scale-105"
        >
          <Card className="h-full overflow-hidden border-none shadow-md">
            <div className="relative aspect-square">
              <Image
                src={category.image || '/placeholder.svg'}
                alt={category.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-lg font-bold text-white">
                  {category.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">
                  {category.description}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
