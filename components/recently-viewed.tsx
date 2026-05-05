'use client';

import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { WishlistButton } from '@/components/wishlist-button';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

export function RecentlyViewed() {
  const { items, clearHistory } = useRecentlyViewed();
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleAddToCart = (item: (typeof items)[0]) => {
    setIsAddingToCart(item.id);

    // Simulate a slight delay for better UX
    setTimeout(() => {
      addItem({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        variant: 'Default'
      });

      toast({
        title: 'Added to cart',
        description: `${item.name} has been added to your cart.`
      });

      setIsAddingToCart(null);
    }, 600);
  };

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Recently Viewed</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          Clear History
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <Card key={item.id} className="group overflow-hidden">
            <div className="relative">
              <Link href={`/products/${item.id}`}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={item.image || '/placeholder.svg'}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </Link>

              <div className="absolute right-2 top-2">
                <WishlistButton product={item} />
              </div>
            </div>

            <CardContent className="p-3">
              <Link href={`/products/${item.id}`}>
                <h3 className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-primary">
                  {item.name}
                </h3>
              </Link>
              <p className="mt-1 text-sm font-medium">
                ${item.price.toFixed(2)}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-8 w-full text-xs"
                onClick={() => handleAddToCart(item)}
                disabled={isAddingToCart === item.id}
              >
                {isAddingToCart === item.id ? (
                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ShoppingCart className="mr-1 h-3 w-3" />
                )}
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
