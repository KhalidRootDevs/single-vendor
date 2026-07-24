export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-100 bg-white p-3">
      <div className="mb-3 aspect-square rounded-lg bg-gray-200" />
      <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mb-3 h-3 w-1/2 rounded bg-gray-200" />
      <div className="h-5 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
