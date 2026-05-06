'use client';

import { Button } from '@/components/ui/button';
import { Check, Eye, ShoppingCart, Star } from 'lucide-react';
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
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [img2Error, setImg2Error] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const {
    selectedOptions,
    selectedVariant,
    effectivePrice,
    effectiveStock,
    effectiveImage,
    isInStock,
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
  const secondImage =
    !img2Error && product.images?.[1] && product.images[1] !== imageSrc
      ? product.images[1]
      : null;

  const cartLabel = !product.active
    ? 'Unavailable'
    : !isInStock
    ? 'Out of Stock'
    : 'Add to Cart';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;

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
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }, 600);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/[0.08] dark:border-white/[0.06] dark:bg-neutral-900 dark:hover:shadow-black/30">
        {/* ── Image ─────────────────────────────────────────── */}
        <Link
          href={`/products/${product.id}`}
          className="block"
          tabIndex={-1}
          aria-hidden
        >
          <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            {/* Primary image */}
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-all duration-500 ease-out group-hover:scale-[1.04]',
                secondImage && 'group-hover:opacity-0'
              )}
              onError={() => setImgError(true)}
            />

            {/* Hover-swap: second image */}
            {secondImage && (
              <Image
                src={secondImage}
                alt={`${product.name} – alternate view`}
                fill
                className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                onError={() => setImg2Error(true)}
              />
            )}

            {/* Out-of-stock / unavailable wash */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] dark:bg-black/50" />
            )}

            {/* Badges — top left */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  -{discount}%
                </span>
              )}
              {isNew && !isBestSeller && (
                <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  New
                </span>
              )}
              {isBestSeller && (
                <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Best Seller
                </span>
              )}
              {!isAvailable && (
                <span className="inline-flex items-center rounded-full bg-neutral-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {!product.active ? 'Unavailable' : 'Out of Stock'}
                </span>
              )}
            </div>

            {/* Quick View — slides up from bottom on hover */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
              <button
                onClick={handleQuickView}
                className="flex w-full items-center justify-center gap-1.5 bg-white/95 py-2.5 text-[11px] font-semibold tracking-wide text-neutral-800 backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/80 dark:text-neutral-100 dark:hover:bg-black/90"
                aria-label={`Quick view ${product.name}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Quick View
              </button>
            </div>
          </div>
        </Link>

        {/* Wishlist — top right, fades in on hover */}
        <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

        {/* ── Content ───────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          {/* Category / brand */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            {product.brand ? `${product.brand} · ` : ''}
            {product.category}
          </p>

          {/* Product name */}
          <Link
            href={`/products/${product.id}`}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary dark:text-neutral-100">
              {product.name}
            </h3>
          </Link>

          {/* Star rating */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-0.5"
              aria-label={`${product.rating.toFixed(1)} out of 5 stars`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {product.rating.toFixed(1)}
              {product.reviewCount > 0 && (
                <span className="ml-0.5">({product.reviewCount})</span>
              )}
            </span>
          </div>

          {/* Spacer pushes price + button to bottom */}
          <div className="mt-auto flex flex-col gap-2.5 pt-1">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                ${effectivePrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="text-sm text-neutral-400 line-through dark:text-neutral-500">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <Button
              className={cn(
                'w-full gap-2 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]',
                isAdded &&
                  'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
              )}
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isAvailable}
              aria-label={cartLabel}
            >
              {isAddingToCart ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </>
              ) : isAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {cartLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
}
