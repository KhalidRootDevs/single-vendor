'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
  className
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              'focus:outline-none',
              interactive &&
                'cursor-pointer transition-transform hover:scale-110'
            )}
            aria-label={`${i + 1} star${i + 1 !== 1 ? 's' : ''}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-muted text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
