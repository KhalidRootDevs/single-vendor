'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface WishlistButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WishlistButton({
  product,
  variant = 'outline',
  size = 'icon',
  className
}: WishlistButtonProps) {
  const { items, addItem, removeItem } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);

  const isInWishlist = items.some((item) => item.id === product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);

    if (isInWishlist) {
      removeItem(product.id);
      toast({
        title: 'Removed from wishlist',
        description: `${product.name} has been removed from your wishlist.`
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category ?? ''
      });
      toast({
        title: 'Added to wishlist',
        description: `${product.name} has been added to your wishlist.`
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'rounded-full transition-all duration-300',
        isInWishlist
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-foreground',
        isAnimating && isInWishlist ? 'scale-110' : '',
        isAnimating && !isInWishlist ? 'scale-110' : '',
        className
      )}
      onClick={toggleWishlist}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all duration-300',
          isInWishlist ? 'fill-current' : 'fill-none'
        )}
      />
    </Button>
  );
}
