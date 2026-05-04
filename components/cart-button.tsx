'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Heart,
  ArrowRight,
  Truck,
  Clock,
  Loader2
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// ─── types ───────────────────────────────────────────────────────────────────

interface CartRecommendation {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

interface PromoResult {
  code: string;
  discountPercent: number;
}

// ─── constants ───────────────────────────────────────────────────────────────

const FREE_SHIPPING_THRESHOLD = 50;

// ─── component ───────────────────────────────────────────────────────────────

export function CartButton() {
  const {
    items,
    updateQuantity,
    removeItem,
    itemCount,
    subtotal,
    shipping,
    tax,
    total,
    addItem
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<typeof items>([]);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [recommendations, setRecommendations] = useState<CartRecommendation[]>(
    []
  );
  const [recsLoading, setRecsLoading] = useState(false);
  const recsAbortRef = useRef<AbortController | null>(null);

  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );

  const discountAmount = appliedPromo
    ? subtotal * (appliedPromo.discountPercent / 100)
    : 0;
  const finalTotal = total - discountAmount;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch recommendations when drawer opens with items in cart
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    recsAbortRef.current?.abort();
    const ctrl = new AbortController();
    recsAbortRef.current = ctrl;

    setRecsLoading(true);

    const cartProductIds = new Set(items.map((i) => i.productId));

    fetch('/api/products?featured=true&limit=10&active=true', {
      signal: ctrl.signal
    })
      .then((res) => res.json())
      .then((data) => {
        const all: CartRecommendation[] = (data.products ?? []).filter(
          (p: CartRecommendation) => !cartProductIds.has(p._id)
        );
        setRecommendations(all.slice(0, 3));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setRecommendations([]);
        }
      })
      .finally(() => {
        setRecsLoading(false);
      });

    return () => ctrl.abort();
  }, [isOpen, items]);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) return;

    setIsApplyingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Promo code invalid',
          description: data.error ?? 'Could not apply promo code.',
          variant: 'destructive'
        });
        return;
      }

      setAppliedPromo({
        code: data.code,
        discountPercent: data.discountPercent
      });
      toast({
        title: 'Promo code applied',
        description: `${data.discountPercent}% discount applied to your order.`
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to validate promo code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsApplyingPromo(false);
    }
  }, [promoCode, subtotal]);

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleSaveForLater = useCallback(
    (item: (typeof items)[0]) => {
      removeItem(item.id);
      setSavedItems((prev) => [...prev, item]);
      toast({
        title: 'Saved for later',
        description: `${item.name} moved to saved items.`
      });
    },
    [removeItem]
  );

  const handleMoveToCart = useCallback(
    (item: (typeof items)[0], index: number) => {
      setSavedItems((prev) => prev.filter((_, i) => i !== index));
      const { id: _id, ...rest } = item;
      addItem(rest);
      toast({
        title: 'Moved to cart',
        description: `${item.name} moved back to cart.`
      });
    },
    [addItem]
  );

  const handleRemoveWithAnimation = useCallback(
    (id: number) => {
      setRemovingItemId(id);
      setTimeout(() => {
        removeItem(id);
        setRemovingItemId(null);
      }, 300);
    },
    [removeItem]
  );

  const getEstimatedDelivery = useCallback(() => {
    const today = new Date();
    const min = new Date(today);
    min.setDate(today.getDate() + 3);
    const max = new Date(today);
    max.setDate(today.getDate() + 5);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(min)} – ${fmt(max)}`;
  }, []);

  const handleAddRecommendation = (product: CartRecommendation) => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] ?? '/placeholder.svg',
      variant: 'Default'
    });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added.`
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative transition-colors hover:bg-primary/10"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          {isMounted && itemCount > 0 && (
            <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {itemCount}
            </Badge>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center text-xl">
            <ShoppingCart className="mr-2 h-5 w-5" aria-hidden />
            Your Cart ({isMounted ? itemCount : 0})
          </SheetTitle>
        </SheetHeader>

        {!isMounted || (items.length === 0 && savedItems.length === 0) ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-medium">Your cart is empty</h3>
            <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
              Looks like you haven't added anything yet. Start shopping to fill
              it with great items!
            </p>
            <Link href="/products" onClick={() => setIsOpen(false)}>
              <Button className="rounded-full px-8">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            {amountToFreeShipping > 0 && (
              <div className="bg-muted/30 px-6 py-3">
                <div className="mb-2 flex items-center">
                  <Truck className="mr-2 h-4 w-4 text-primary" aria-hidden />
                  <p className="text-sm font-medium">
                    Add ${amountToFreeShipping.toFixed(2)} more for free
                    shipping
                  </p>
                </div>
                <Progress
                  value={freeShippingProgress}
                  className="h-1.5"
                  aria-label={`${Math.round(
                    freeShippingProgress
                  )}% toward free shipping`}
                />
              </div>
            )}

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-5 py-4">
                {/* Cart items */}
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={cn(
                      'flex gap-4 rounded-lg bg-background p-3 transition-all duration-300 hover:bg-muted/50',
                      removingItemId === item.id &&
                        'translate-x-full transform opacity-0'
                    )}
                    aria-label={item.name}
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="line-clamp-1 font-medium">
                            {item.name}
                          </h3>
                          {item.variant && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.variant}
                            </p>
                          )}
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div
                          className="flex items-center rounded-full border"
                          role="group"
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </Button>
                          <span
                            className="w-8 text-center text-sm"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              item.maxStock !== undefined &&
                              item.quantity >= item.maxStock
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </Button>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-muted"
                            onClick={() => handleSaveForLater(item)}
                            aria-label={`Save ${item.name} for later`}
                          >
                            <Heart className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-muted"
                            onClick={() => handleRemoveWithAnimation(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Saved for later */}
              {savedItems.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="mb-3 font-medium">
                    Saved for Later ({savedItems.length})
                  </h3>
                  <div className="space-y-4">
                    {savedItems.map((item, index) => (
                      <div key={item.id} className="flex gap-3 p-2">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-1 text-sm font-medium">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)}
                          </p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => handleMoveToCart(item, index)}
                          >
                            Move to Cart
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* You Might Also Like */}
              {items.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="mb-3 font-medium">You Might Also Like</h3>

                  {recsLoading ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="text-center">
                          <div className="mx-auto mb-2 h-20 w-20 animate-pulse rounded-md bg-muted" />
                          <div className="mx-auto mb-1 h-3 w-14 animate-pulse rounded bg-muted" />
                          <div className="mx-auto h-3 w-10 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {recommendations.map((product) => (
                        <div key={product._id} className="text-center">
                          <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={product.images[0] ?? '/placeholder.svg'}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <h4 className="line-clamp-2 text-xs font-medium leading-tight">
                            {product.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => handleAddRecommendation(product)}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="h-4" aria-hidden />
            </ScrollArea>

            {items.length > 0 && (
              <>
                {/* Promo code */}
                <div className="border-t px-6 py-3">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Badge
                          variant="outline"
                          className="border-green-300 bg-green-100 text-green-700"
                        >
                          {appliedPromo.code}
                        </Badge>
                        <span>{appliedPromo.discountPercent}% off applied</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-green-700 hover:text-green-900"
                        onClick={handleRemovePromo}
                        aria-label="Remove promo code"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) =>
                          setPromoCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleApplyPromo()
                        }
                        className="rounded-full"
                        disabled={isApplyingPromo}
                        aria-label="Enter promo code"
                      />
                      <Button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode.trim()}
                        className="rounded-full"
                      >
                        {isApplyingPromo ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order summary */}
                <div className="border-t bg-muted/30 px-6 py-4">
                  <dl className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd>${subtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Shipping</dt>
                      <dd>
                        {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Tax</dt>
                      <dd>${tax.toFixed(2)}</dd>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-sm text-green-600">
                        <dt>Discount ({appliedPromo.discountPercent}%)</dt>
                        <dd>-${discountAmount.toFixed(2)}</dd>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <dt>Total</dt>
                      <dd>${finalTotal.toFixed(2)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    <span>Estimated delivery: {getEstimatedDelivery()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <SheetFooter className="border-t px-6 py-4">
                  <div className="grid w-full grid-cols-2 gap-3">
                    <Link
                      href="/cart"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      <Button variant="outline" className="w-full rounded-full">
                        View Cart
                      </Button>
                    </Link>
                    <Link
                      href="/checkout"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      <Button className="w-full rounded-full">
                        Checkout
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                      </Button>
                    </Link>
                  </div>
                </SheetFooter>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
