import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonProductCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.06] dark:bg-neutral-900">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Category */}
        <Skeleton className="h-2.5 w-1/4" />

        {/* Name */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Rating */}
        <Skeleton className="h-3 w-2/5" />

        {/* Price */}
        <div className="mt-auto pt-1">
          <Skeleton className="mb-2.5 h-6 w-1/3" />

          {/* Button */}
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
