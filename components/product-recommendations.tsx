'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { Product, ProductCardData } from '@/types';
import { ProductCard } from '@/components/product-card';

interface ProductRecommendationsProps {
  productId: string;
  category: string;
}

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

export function ProductRecommendations({
  productId,
  category: _category
}: ProductRecommendationsProps) {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/products/${productId}/related?limit=4`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch related products');
        }

        const data = await response.json();
        setRecommendedProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching related products:', err);

        try {
          const fallbackResponse = await fetch(
            '/api/products?type=featured&limit=4'
          );
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setRecommendedProducts(fallbackData.products || []);
          }
        } catch (fallbackErr) {
          console.error('Fallback fetch also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="group h-full overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-3">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-3 w-1/2" />
                <Skeleton className="mb-2 h-4 w-1/3" />
                <Skeleton className="mt-2 h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {recommendedProducts.map((product) => (
          <ProductCard key={product._id} product={toCardData(product)} />
        ))}
      </div>

      {error && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing featured products instead
        </div>
      )}
    </div>
  );
}
