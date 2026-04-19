'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/ui/container';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, shipping, tax, total } =
    useCart();
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() })
      });

      if (response.ok) {
        toast.success(`Promo code "${promoCode}" applied!`);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Invalid or expired promo code.');
      }
    } catch {
      toast.error('Unable to validate promo code. Please try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container>
        <div className="py-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-8 flex items-center">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="ml-2 text-muted-foreground">
          ({items.length} items)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.variant}
                          </p>
                          <p className="mt-1 font-medium">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5 text-muted-foreground" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center rounded-md border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease quantity</span>
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase quantity</span>
                          </Button>
                        </div>
                        <div className="ml-auto font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Taxes calculated at checkout
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/checkout" className="w-full">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium">Have a promo code?</h3>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Enter code"
                  className="flex-1"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo || !promoCode}
                >
                  {isApplyingPromo ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
