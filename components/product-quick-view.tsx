'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { WishlistButton } from '@/components/wishlist-button';
import { toast } from '@/components/ui/use-toast';
import { ProductCardData } from '@/types';
import { useProductVariants } from '@/hooks/use-product-variants';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = '/placeholder.svg';

interface ProductQuickViewProps {
  product: ProductCardData;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose
}: ProductQuickViewProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

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

  const images = product.images.length > 0 ? product.images : [FALLBACK_IMAGE];

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

  const increaseQuantity = () =>
    setQuantity((prev) => Math.min(prev + 1, Math.min(10, effectiveStock)));
  const decreaseQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const handleAddToCart = () => {
    if (!isInStock || !areAllSelected) return;
    setIsAddingToCart(true);

    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        quantity,
        image: effectiveImage,
        variant: formatSelected() || 'Default',
        selectedOptions:
          Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
        variantSku: selectedVariant?.sku,
        maxStock: effectiveStock
      });

      toast({
        title: 'Added to cart',
        description: `${quantity} × ${product.name}${
          formatSelected() ? ` (${formatSelected()})` : ''
        } added to your cart.`
      });

      setIsAddingToCart(false);
      onClose();
    }, 600);
  };

  const getImageSrc = (index: number) =>
    imgErrors[index] ? FALLBACK_IMAGE : images[index] || FALLBACK_IMAGE;

  // Sync active image to variant image when variant changes
  const displayImageIndex = (() => {
    if (!selectedVariant?.image) return activeImage;
    const idx = images.indexOf(selectedVariant.image);
    return idx >= 0 ? idx : activeImage;
  })();

  const cartLabel = !product.active
    ? 'Unavailable'
    : !isInStock
    ? 'Out of Stock'
    : !areAllSelected
    ? 'Select All Options'
    : 'Add to Cart';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[900px]">
        <div className="absolute right-4 top-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Images */}
          <div className="relative">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={getImageSrc(displayImageIndex)}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                onError={() =>
                  setImgErrors((prev) => ({
                    ...prev,
                    [displayImageIndex]: true
                  }))
                }
              />

              {discount > 0 && (
                <Badge className="absolute right-2 top-2 bg-red-500">
                  {discount}% OFF
                </Badge>
              )}
              {isNew && (
                <Badge className="absolute left-2 top-2 bg-green-500">
                  New
                </Badge>
              )}
              {isBestSeller && (
                <Badge className="absolute bottom-2 left-2 bg-amber-500">
                  Best Seller
                </Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      displayImageIndex === index
                        ? 'w-4 bg-primary'
                        : 'w-2 bg-primary/30'
                    )}
                    onClick={() => setActiveImage(index)}
                  >
                    <span className="sr-only">View image {index + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col p-6">
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">
                {product.category}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{product.name}</h2>
              {product.brand && (
                <p className="text-xs text-muted-foreground">{product.brand}</p>
              )}
            </div>

            {product.rating > 0 && (
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
                <span className="ml-1 text-sm text-muted-foreground">
                  ({product.rating.toFixed(1)})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              {discount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    ${effectivePrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.compareAtPrice?.toFixed(2)}
                  </span>
                  <Badge className="bg-red-100 text-xs text-red-700">
                    {discount}% OFF
                  </Badge>
                </div>
              ) : (
                <span className="text-2xl font-bold">
                  ${effectivePrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
              {product.description ||
                'A high-quality product with excellent features and durability.'}
            </p>

            {effectiveStock > 0 && effectiveStock <= 10 && (
              <p className="mb-3 text-xs font-medium text-amber-600">
                Only {effectiveStock} left in stock
              </p>
            )}

            {/* Variant Selectors */}
            {groupedVariants.length > 0 && (
              <div className="mb-4 space-y-3">
                {groupedVariants.map((group) => (
                  <div key={group.name}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {group.name}
                      </span>
                      {selectedOptions[group.name] && (
                        <span className="text-sm text-muted-foreground">
                          — {selectedOptions[group.name]}
                        </span>
                      )}
                      {group.hasPriceVariation && (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">
                          Price varies
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((option) => {
                        const isSelected =
                          selectedOptions[group.name] === option;
                        const invalid = isOptionInvalid(group.name, option);
                        const oos = isOptionOos(group.name, option);

                        return (
                          <button
                            key={option}
                            onClick={() => {
                              if (!invalid) handleSelect(group.name, option);
                            }}
                            disabled={invalid || (!isSelected && oos)}
                            title={
                              invalid
                                ? 'Combination not available'
                                : oos
                                ? 'Out of stock'
                                : undefined
                            }
                            className={cn(
                              'h-8 rounded border px-3 text-sm font-medium transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background hover:border-primary',
                              oos &&
                                !isSelected &&
                                'cursor-not-allowed line-through opacity-40',
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

            <div className="mt-auto space-y-4">
              {/* Quantity */}
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium">Quantity</span>
                <div className="flex items-center rounded-full border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                    <span className="sr-only">Decrease quantity</span>
                  </Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={increaseQuantity}
                    disabled={quantity >= Math.min(10, effectiveStock)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Increase quantity</span>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={
                    isAddingToCart ||
                    !product.active ||
                    !isInStock ||
                    !areAllSelected
                  }
                >
                  {isAddingToCart ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Adding...
                    </div>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {cartLabel}
                    </>
                  )}
                </Button>

                <WishlistButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: effectivePrice,
                    image: effectiveImage,
                    category: product.category
                  }}
                  variant="outline"
                />
              </div>

              <Link
                href={`/products/${product.id}`}
                className="block text-sm text-primary hover:underline"
                onClick={onClose}
              >
                View full details →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
