'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WishlistDrawer() {
  const { items, removeItem, itemCount, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const handleRemoveWithAnimation = (id: string) => {
    setRemovingItemId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingItemId(null);
    }, 300);
  };

  const handleAddToCart = (item: (typeof items)[0]) => {
    addToCart({
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
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative transition-colors hover:bg-pink-50"
          onClick={() => setIsOpen(true)}
        >
          <Heart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs text-white">
              {itemCount}
            </Badge>
          )}
          <span className="sr-only">Open wishlist</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center text-xl">
            <Heart className="mr-2 h-5 w-5 text-pink-500" />
            Your Wishlist ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-pink-50">
              <Heart className="h-12 w-12 text-pink-300" />
            </div>
            <h3 className="mb-2 text-xl font-medium">Your wishlist is empty</h3>
            <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
              Save items you love for later by clicking the heart icon on any
              product.
            </p>
            <Link href="/products" onClick={() => setIsOpen(false)}>
              <Button className="rounded-full px-8">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-5 py-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 rounded-lg bg-background p-3 transition-all duration-300 hover:bg-muted/50 ${
                      removingItemId === item.id
                        ? 'translate-x-full transform opacity-0'
                        : ''
                    }`}
                  >
                    <Link
                      href={`/products/${item.id}`}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.id}`}
                        onClick={() => setIsOpen(false)}
                      >
                        <h3 className="line-clamp-1 font-medium hover:underline">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.category}
                      </p>
                      <p className="mt-1 font-medium">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full text-xs"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          Add to Cart
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-pink-50 hover:text-pink-500"
                          onClick={() => handleRemoveWithAnimation(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t px-6 py-4">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={clearWishlist}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Wishlist
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
