import { Product, ProductCardData } from '@/types';
import { ProductCard } from '@/components/product-card';

async function getProducts(
  type: 'featured' | 'best-selling' | 'top-rated' | 'new-arrivals'
): Promise<Product[]> {
  try {
    const response = await fetch(
      `${process.env.APP_URL}/api/products?type=${type}&limit=8`,
      {
        next: {
          revalidate: 3600,
          tags: ['products']
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error(`Error fetching ${type} products:`, error);
    return [];
  }
}

const fallbackProducts: Record<string, ProductCardData[]> = {
  featured: [
    {
      id: '1',
      name: 'Premium T-Shirt',
      description: 'High-quality cotton t-shirt',
      price: 29.99,
      compareAtPrice: 39.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Clothing',
      rating: 4.5,
      reviewCount: 24,
      salesCount: 150,
      featured: true,
      active: true,
      stock: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones',
      price: 129.99,
      compareAtPrice: 159.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Electronics',
      rating: 4.8,
      reviewCount: 89,
      salesCount: 320,
      featured: true,
      active: true,
      stock: 30,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Leather Wallet',
      description: 'Genuine leather wallet',
      price: 49.99,
      compareAtPrice: 69.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Accessories',
      rating: 4.3,
      reviewCount: 42,
      salesCount: 180,
      featured: true,
      active: true,
      stock: 75,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Smart Watch',
      description: 'Advanced smartwatch with health tracking',
      price: 199.99,
      compareAtPrice: 249.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Electronics',
      rating: 4.7,
      reviewCount: 156,
      salesCount: 420,
      featured: true,
      active: true,
      stock: 20,
      createdAt: new Date().toISOString()
    }
  ],
  'best-selling': [
    {
      id: '5',
      name: 'Running Shoes',
      description: 'Lightweight running shoes',
      price: 89.99,
      compareAtPrice: 119.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Footwear',
      rating: 4.6,
      reviewCount: 203,
      salesCount: 890,
      featured: true,
      active: true,
      stock: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: '6',
      name: 'Bluetooth Speaker',
      description: 'Portable Bluetooth speaker',
      price: 79.99,
      compareAtPrice: 99.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Electronics',
      rating: 4.4,
      reviewCount: 167,
      salesCount: 540,
      featured: true,
      active: true,
      stock: 45,
      createdAt: new Date().toISOString()
    },
    {
      id: '7',
      name: 'Backpack',
      description: 'Durable travel backpack',
      price: 59.99,
      compareAtPrice: 79.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Accessories',
      rating: 4.5,
      reviewCount: 98,
      salesCount: 320,
      featured: true,
      active: true,
      stock: 80,
      createdAt: new Date().toISOString()
    },
    {
      id: '8',
      name: 'Sunglasses',
      description: 'UV protection sunglasses',
      price: 39.99,
      compareAtPrice: 59.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Accessories',
      rating: 4.2,
      reviewCount: 76,
      salesCount: 210,
      featured: true,
      active: true,
      stock: 90,
      createdAt: new Date().toISOString()
    }
  ],
  'top-rated': [
    {
      id: '9',
      name: 'Coffee Maker',
      description: 'Programmable coffee maker',
      price: 149.99,
      compareAtPrice: 199.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Home',
      rating: 4.9,
      reviewCount: 234,
      salesCount: 670,
      featured: true,
      active: true,
      stock: 25,
      createdAt: new Date().toISOString()
    },
    {
      id: '10',
      name: 'Yoga Mat',
      description: 'Non-slip yoga mat',
      price: 29.99,
      compareAtPrice: 39.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Fitness',
      rating: 4.8,
      reviewCount: 189,
      salesCount: 450,
      featured: true,
      active: true,
      stock: 100,
      createdAt: new Date().toISOString()
    },
    {
      id: '11',
      name: 'Water Bottle',
      description: 'Insulated water bottle',
      price: 19.99,
      compareAtPrice: 29.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Fitness',
      rating: 4.7,
      reviewCount: 156,
      salesCount: 780,
      featured: true,
      active: true,
      stock: 150,
      createdAt: new Date().toISOString()
    },
    {
      id: '12',
      name: 'Desk Lamp',
      description: 'LED desk lamp',
      price: 49.99,
      compareAtPrice: 69.99,
      images: ['/placeholder.svg?height=400&width=400'],
      category: 'Home',
      rating: 4.6,
      reviewCount: 134,
      salesCount: 290,
      featured: true,
      active: true,
      stock: 40,
      createdAt: new Date().toISOString()
    }
  ]
};

function toCardData(product: Product): ProductCardData {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    category: product.categoryId?.name || '',
    brand: product.brand,
    rating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    featured: product.featured,
    active: product.active,
    createdAt: product.createdAt,
    description: product.description,
    stock: product.stock ?? 0,
    variants: product.variants
  };
}

export async function ProductGrid({
  type
}: {
  type: 'featured' | 'best-selling' | 'top-rated' | 'new-arrivals';
}) {
  const products = await getProducts(type);

  const displayProducts: ProductCardData[] =
    products.length > 0
      ? products.map(toCardData)
      : fallbackProducts[type] || [];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
