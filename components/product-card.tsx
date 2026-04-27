'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { WishlistButton } from '@/components/wishlist-button';
import { toast } from '@/components/ui/use-toast';
import { ProductCardProps } from '@/types';
import { ProductQuickView } from '@/components/product-quick-view';
import { useProductVariants } from '@/hooks/use-product-variants';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = '/placeholder.svg';

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const {
    groupedVariants,
    selectedOptions,
    selectedVariant,
    effectivePrice,
    effectiveStock,
    effectiveImage,
    isInStock,
    areAllSelected,
    handleSelect,
    isOptionInvalid,
    isOptionOos,
    formatSelected
  } = useProductVariants(
    product.variants,
    product.price,
    product.stock,
    product.images
  );

  const discount =
    product.compareAtPrice && product.compareAtPrice > effectivePrice
      ? Math.round(
          ((product.compareAtPrice - effectivePrice) / product.compareAtPrice) *
            100
        )
      : 0;

  const isNew =
    new Date(product.createdAt) >
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const isBestSeller = product.salesCount > 100;
  const isAvailable = product.active && isInStock;
  const imageSrc = imgError ? FALLBACK_IMAGE : effectiveImage || FALLBACK_IMAGE;

  const cartLabel = !product.active
    ? 'Unavailable'
    : !isInStock
    ? 'Out of Stock'
    : !areAllSelected
    ? 'Select Options'
    : 'Add to Cart';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || !areAllSelected) return;

    setIsAddingToCart(true);
    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        quantity: 1,
        image: imageSrc,
        variant: formatSelected() || 'Default',
        selectedOptions:
          Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
        variantSku: selectedVariant?.sku,
        maxStock: effectiveStock
      });

      toast({
        title: 'Added to cart',
        description: `${product.name}${
          formatSelected() ? ` (${formatSelected()})` : ''
        } added to your cart.`
      });
      setIsAddingToCart(false);
    }, 600);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative">
          <Link href={`/products/${product.id}`}>
            <div className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onError={() => setImgError(true)}
              />

              {/* Badges */}
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {discount > 0 && (
                  <Badge className="bg-red-500 text-xs hover:bg-red-600">
                    {discount}% OFF
                  </Badge>
                )}
                {isNew && (
                  <Badge className="bg-green-500 text-xs hover:bg-green-600">
                    New
                  </Badge>
                )}
                {isBestSeller && (
                  <Badge className="bg-amber-500 text-xs hover:bg-amber-600">
                    Best Seller
                  </Badge>
                )}
                {!isAvailable && (
                  <Badge className="bg-gray-500 text-xs hover:bg-gray-600">
                    {!product.active ? 'Unavailable' : 'Out of Stock'}
                  </Badge>
                )}
              </div>

              {product.rating >= 4 && (
                <Badge className="absolute right-2 top-2 bg-blue-500 text-xs hover:bg-blue-600">
                  ⭐ {product.rating.toFixed(1)}
                </Badge>
              )}

              {/* Quick View overlay */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1.5 bg-white/90 text-xs font-medium text-foreground shadow hover:bg-white"
                  onClick={handleQuickView}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Quick View
                </Button>
              </div>
            </div>
          </Link>

          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <WishlistButton
              product={{
                id: product.id,
                name: product.name,
                price: effectivePrice,
                image: imageSrc,
                category: product.category
              }}
            />
          </div>
        </div>

        <CardContent className="p-4">
          <Link href={`/products/${product.id}`}>
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
              {product.name}
            </h3>
          </Link>

          <p className="mb-2 text-xs text-muted-foreground">
            {product.brand && `${product.brand} • `}
            {product.category}
          </p>

          {/* Star Rating */}
          <div className="mb-2 flex items-center">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < Math.floor(product.rating)
                      ? 'fill-current text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="ml-1 text-xs text-muted-foreground">
              ({product.rating.toFixed(1)})
            </span>
          </div>

          {/* Compact Variant Selectors */}
          {groupedVariants.length > 0 && (
            <div className="mb-3 space-y-2">
              {groupedVariants.map((group) => (
                <div key={group.name}>
                  <p className="mb-1 text-xs capitalize text-muted-foreground">
                    {group.name}:{' '}
                    <span className="font-medium text-foreground">
                      {selectedOptions[group.name] ?? '—'}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.options.map((option) => {
                      const isSelected = selectedOptions[group.name] === option;
                      const invalid = isOptionInvalid(group.name, option);
                      const oos = isOptionOos(group.name, option);

                      return (
                        <button
                          key={option}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!invalid) handleSelect(group.name, option);
                          }}
                          disabled={invalid}
                          title={
                            invalid
                              ? 'Combination not available'
                              : oos
                              ? 'Out of stock'
                              : undefined
                          }
                          className={cn(
                            'h-6 rounded border px-2 text-xs font-medium transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:border-primary',
                            oos && !isSelected && 'line-through opacity-40',
                            invalid && 'cursor-not-allowed opacity-30'
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            {discount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-green-600">
                  ${effectivePrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-base font-bold">
                ${effectivePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isAvailable || !areAllSelected}
          >
            {isAddingToCart ? (
              <>
                <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-4 w-4" />
                {cartLabel}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
}
