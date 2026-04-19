'use client';

import type React from 'react';

import { ProductRecommendations } from '@/components/product-recommendations';
import { RecentlyViewed } from '@/components/recently-viewed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { WishlistButton } from '@/components/wishlist-button';
import { useCart } from '@/context/cart-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { GroupedVariant, Product, Review } from '@/types';
import { Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// Mock reviews data (you can replace this with an API later)
const mockReviews: Review[] = [
  {
    id: '1',
    user: 'John D.',
    rating: 5,
    comment:
      'Great quality product. Fits perfectly and the material is very comfortable.',
    date: '2023-05-15'
  },
  {
    id: '2',
    user: 'Sarah M.',
    rating: 4,
    comment: 'Nice product, good quality. Exactly as described.',
    date: '2023-04-22'
  },
  {
    id: '3',
    user: 'Michael P.',
    rating: 5,
    comment: 'Excellent product. This is my third purchase!',
    date: '2023-03-10'
  }
];

export default function ProductPage({ params }: { params: { id: string } }) {
  const { addItem } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [activeImage, setActiveImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Extract all unique variant attributes and group options
  const groupedVariants = useMemo((): GroupedVariant[] => {
    if (!product?.variants || product.variants.length === 0) return [];

    const attributeMap: Record<string, Set<string>> = {};
    const priceVariation: Record<string, boolean> = {};
    const stockVariation: Record<string, boolean> = {};

    // First pass: collect all attributes and their possible values
    product.variants.forEach((variant) => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!attributeMap[key]) {
          attributeMap[key] = new Set();
        }
        attributeMap[key].add(value);

        // Check for price variation
        if (variant.price !== undefined && variant.price !== product.price) {
          priceVariation[key] = true;
        }

        // Check for stock variation
        if (variant.stock !== undefined && variant.stock !== product.stock) {
          stockVariation[key] = true;
        }
      });
    });

    // Convert to array format
    return Object.entries(attributeMap).map(([name, optionsSet]) => ({
      name,
      options: Array.from(optionsSet),
      hasPriceVariation: priceVariation[name] || false,
      hasStockVariation: stockVariation[name] || false
    }));
  }, [product?.variants, product?.price, product?.stock]);

  // Find the selected variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!product?.variants || Object.keys(selectedOptions).length === 0) {
      return null;
    }

    return product.variants.find((variant) =>
      Object.entries(selectedOptions).every(
        ([key, value]) => variant.attributes[key] === value
      )
    );
  }, [product?.variants, selectedOptions]);

  // Get display price (variant price or base product price)
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

  // Get display stock (variant stock or base product stock)
  const displayStock = selectedVariant?.stock ?? product?.stock ?? 0;

  // Get variant image if available
  const displayImage = selectedVariant?.image
    ? product?.images.find((img) => img === selectedVariant.image) ||
      product?.images[0]
    : product?.images[0];

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data.product);

        // Add to recently viewed
        addToRecentlyViewed({
          id: data.product._id,
          name: data.product.name,
          price: data.product.price,
          image: data.product.images[0],
          category: data.product.categoryId?.name
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, addToRecentlyViewed]);

  // Handle quantity changes
  const increaseQuantity = () => {
    if (quantity < displayStock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Check if a variant option is valid given current selections
  const isVariantOptionValid = (
    variantName: string,
    option: string
  ): boolean => {
    const testOptions = {
      ...selectedOptions,
      [variantName]: option
    };

    // Check if any product variant matches this combination
    return (
      product?.variants.some((variant) =>
        Object.entries(testOptions).every(
          ([key, value]) => variant.attributes[key] === value
        )
      ) || false
    );
  };

  // Handle variant selection with deselect functionality
  const handleVariantSelect = (variantName: string, option: string) => {
    // If the clicked option is already selected, deselect it
    if (selectedOptions[variantName] === option) {
      const newSelectedOptions = { ...selectedOptions };
      delete newSelectedOptions[variantName];
      setSelectedOptions(newSelectedOptions);
      return;
    }

    // Only update if the option is valid (exists in product variants)
    if (isVariantOptionValid(variantName, option)) {
      setSelectedOptions({
        ...selectedOptions,
        [variantName]: option
      });
    }
    // If option is invalid, do nothing (don't clear selections)
  };

  // Check if all required variants are selected
  const areAllVariantsSelected = () => {
    if (!groupedVariants || groupedVariants.length === 0) return true;
    return groupedVariants.every((variant) => selectedOptions[variant.name]);
  };

  // Format selected variants for display
  const formatSelectedVariants = () => {
    if (!groupedVariants || groupedVariants.length === 0) return '';
    return Object.entries(selectedOptions)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  // Handle image zoom
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    const comparePrice = product?.compareAtPrice;
    if (!comparePrice || comparePrice <= displayPrice) return 0;
    return Math.round(((comparePrice - displayPrice) / comparePrice) * 100);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;

    if (!areAllVariantsSelected()) {
      toast({
        title: 'Please select all options',
        description:
          'You need to select all product options before adding to cart.',
        variant: 'destructive'
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      addItem({
        productId: product._id,
        name: product.name,
        price: displayPrice,
        quantity,
        image: displayImage || product.images[0],
        variant: formatSelectedVariants(),
        selectedOptions,
        variantSku: selectedVariant?.sku,
        maxStock: displayStock
      });

      toast({
        title: 'Added to cart',
        description: `${quantity} × ${product.name}${
          formatSelectedVariants() ? ` (${formatSelectedVariants()})` : ''
        } has been added to your cart.`
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    if (!product) return;

    if (!areAllVariantsSelected()) {
      toast({
        title: 'Please select all options',
        description:
          'You need to select all product options before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      quantity,
      image: displayImage || product.images[0],
      variant: formatSelectedVariants(),
      selectedOptions,
      variantSku: selectedVariant?.sku,
      maxStock: displayStock
    });

    router.push('/checkout');
  };

  // Loading state
  if (loading) {
    return (
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            <div>
              <Skeleton className="mb-2 h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <Container>
        <div className="py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Product Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </div>
      </Container>
    );
  }

  const discount = calculateDiscount();
  const isInStock = displayStock > 0;

  return (
    <Container>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-square overflow-hidden rounded-lg border"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleImageMouseMove}
          >
            <div
              className={`absolute inset-0 transition-transform duration-200 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={
                isZoomed
                  ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                  : undefined
              }
            >
              <Image
                src={displayImage || '/placeholder.svg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {isZoomed && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                Hover to zoom
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <div
                key={index}
                className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border ${
                  activeImage === index ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveImage(index)}
              >
                <Image
                  src={image || '/placeholder.svg'}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              Category: {product.categoryId?.name}
            </p>
            {product.brand && (
              <p className="text-sm text-muted-foreground">
                Brand: {product.brand}
              </p>
            )}
            {product.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-current text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            {discount > 0 ? (
              <>
                <span className="text-3xl font-bold">
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                  {discount}% OFF
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold">
                ${displayPrice.toFixed(2)}
              </span>
            )}
            {selectedVariant?.price !== undefined &&
              selectedVariant.price !== product.price && (
                <span className="text-sm text-green-600">(Variant price)</span>
              )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {/* Grouped Variants */}
          <div className="space-y-3">
            {groupedVariants.map((variant, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-medium capitalize">
                    {variant.name}
                  </h3>
                  {variant.hasPriceVariation && (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">
                      Price
                    </span>
                  )}
                  {variant.hasStockVariation && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                      Stock
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variant.options.map((option, optionIndex) => {
                    const isSelected = selectedOptions[variant.name] === option;
                    const isValidOption = isVariantOptionValid(
                      variant.name,
                      option
                    );

                    return (
                      <Button
                        key={optionIndex}
                        variant={isSelected ? 'default' : 'outline'}
                        className="h-8 px-3 text-sm"
                        onClick={() =>
                          handleVariantSelect(variant.name, option)
                        }
                        disabled={!isValidOption}
                        title={
                          !isValidOption
                            ? 'This combination is not available'
                            : ''
                        }
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Variant Info */}
          {selectedVariant && (
            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <p className="font-medium text-blue-800">
                Selected: {formatSelectedVariants()}
              </p>
              {selectedVariant.sku && (
                <p className="text-blue-700">
                  Variant SKU: {selectedVariant.sku}
                </p>
              )}
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-4">
            <div className="flex items-center">
              <h3 className="mr-4 font-medium">Quantity</h3>
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease quantity</span>
                </Button>
                <span className="w-10 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={increaseQuantity}
                  disabled={quantity >= displayStock}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase quantity</span>
                </Button>
              </div>
              <span className="ml-4 text-sm text-muted-foreground">
                {displayStock} available
              </span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart || !isInStock || !areAllVariantsSelected()
                }
              >
                {isAddingToCart ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Adding...
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {!areAllVariantsSelected()
                      ? 'Select all options'
                      : isInStock
                      ? 'Add to Cart'
                      : 'Out of Stock'}
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                size="lg"
                onClick={handleBuyNow}
                disabled={
                  isAddingToCart || !isInStock || !areAllVariantsSelected()
                }
              >
                Buy Now
              </Button>
              <WishlistButton
                product={{
                  id: product._id,
                  name: product.name,
                  price: displayPrice,
                  image: displayImage || product.images[0],
                  category: product.categoryId?.name
                }}
                variant="outline"
                size="lg"
                className="h-12 w-12"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
            <p className="font-medium">
              Availability: {isInStock ? 'In Stock' : 'Out of Stock'}
            </p>
            {product.weight && <p>Weight: {product.weight} kg</p>}
            <p>Free shipping on orders over $50</p>
            <p>30-day return policy</p>
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Product Tabs */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({mockReviews.length})
          </TabsTrigger>
          <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="py-4">
          <div className="prose max-w-none">
            <p>{product.description}</p>
            {product.tags.length > 0 && (
              <div className="mt-4">
                <strong>Tags:</strong> {product.tags.join(', ')}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="py-4">
          <div className="space-y-6">
            {mockReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{review.user}</p>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-current text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2">{review.comment}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Shipping Policy</h3>
              <p className="mt-2">
                We offer free standard shipping on all orders over $50. Orders
                under $50 will be charged a flat rate of $5.99 for shipping.
                Standard shipping typically takes 3-5 business days. Express
                shipping is available for an additional fee.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Return Policy</h3>
              <p className="mt-2">
                We accept returns within 30 days of purchase. Items must be
                unused and in their original packaging. Return shipping is free
                for defective items. For non-defective items, a return shipping
                fee may apply.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="py-4">
          <div className="space-y-4">
            {product.weight && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">Weight</span>
                <span>{product.weight} kg</span>
              </div>
            )}
            {product.length && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">Length</span>
                <span>{product.length} cm</span>
              </div>
            )}
            {product.width && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">Width</span>
                <span>{product.width} cm</span>
              </div>
            )}
            {product.height && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">Height</span>
                <span>{product.height} cm</span>
              </div>
            )}
            {product.brand && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">Brand</span>
                <span>{product.brand}</span>
              </div>
            )}
            {product.sku && (
              <div className="flex justify-between border-b py-2">
                <span className="font-medium">SKU</span>
                <span>{product.sku}</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Recommendations */}
      <ProductRecommendations
        productId={product._id}
        category={product.categoryId?.name}
      />

      {/* Recently Viewed Products */}
      <RecentlyViewed />
    </Container>
  );
}
