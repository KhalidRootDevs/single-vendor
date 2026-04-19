'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { Product } from '@/types';

interface ProductListProps {
  products: Product[];
  categories?: unknown[];
  brands?: unknown[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => {
        const image =
          product.images?.[0] ?? '/placeholder.svg?height=200&width=200';
        const discountPct =
          product.compareAtPrice && product.compareAtPrice > product.price
            ? Math.round(
                ((product.compareAtPrice - product.price) /
                  product.compareAtPrice) *
                  100
              )
            : 0;
        const isNew =
          new Date(product.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        return (
          <Card
            key={product._id}
            className="overflow-hidden transition-shadow hover:shadow-lg"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 flex-shrink-0 sm:h-auto sm:w-48">
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
                {discountPct > 0 && (
                  <div className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {discountPct}% OFF
                  </div>
                )}
                {isNew && (
                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    NEW
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {product.name}
                    </h3>
                    {product.categoryId?.name && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {product.categoryId.name}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({product.rating.toFixed(1)})
                        {product.reviewCount > 0 &&
                          ` · ${product.reviewCount} reviews`}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold">
                      ${product.price.toFixed(2)}
                    </p>
                    {discountPct > 0 && product.compareAtPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${product.compareAtPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {product.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {product.salesCount > 50 && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800"
                    >
                      Best Seller
                    </Badge>
                  )}
                  {product.brand && (
                    <span className="text-xs text-muted-foreground">
                      {product.brand}
                    </span>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <Badge
                      variant="outline"
                      className="border-orange-300 text-orange-600"
                    >
                      Only {product.stock} left
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}

                  <div className="ml-auto flex gap-2">
                    <Link
                      href={`/products/${product._id}`}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
