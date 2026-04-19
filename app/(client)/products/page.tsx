'use client';

import type React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ProductFilters } from '@/components/products/product-filters';
import { ActiveFilters } from '@/components/products/active-filters';
import { ProductSorting } from '@/components/products/product-sorting';
import { ProductPagination } from '@/components/products/product-pagination';
import { EmptyProductState } from '@/components/products/empty-product-state';
import { ProductList } from '@/components/products/product-list';
import { sortOptions } from '@/lib/product-data';
import { Container } from '@/components/ui/container';
import { ProductCard } from '@/components/product-card';
import { SkeletonProductCard } from '@/components/skeleton-product-card';
import type { Category, Product } from '@/types';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filter state lazily from URL params — no cascading effects
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParams.get('q') || ''
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => searchParams.get('categories')?.split(',').filter(Boolean) ?? []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    () => searchParams.get('brands')?.split(',').filter(Boolean) ?? []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    Number(searchParams.get('minPrice') ?? 0),
    Number(searchParams.get('maxPrice') ?? 1000)
  ]);
  const [selectedRating, setSelectedRating] = useState(
    () => searchParams.get('rating') || 'all'
  );
  const [sortBy, setSortBy] = useState(
    () => searchParams.get('sort') || 'featured'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (searchParams.get('view') as 'grid' | 'list') || 'grid'
  );
  const [currentPage, setCurrentPage] = useState(() =>
    Number(searchParams.get('page') ?? 1)
  );

  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search — only this triggers a delayed state update
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  // Single fetch effect — all filter dependencies in one place
  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategories.length > 0)
        params.set('categories', selectedCategories.join(','));
      if (selectedBrands.length > 0)
        params.set('brands', selectedBrands.join(','));
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < priceMax)
        params.set('maxPrice', priceRange[1].toString());
      if (selectedRating !== 'all') {
        params.set('minRating', selectedRating === '4plus' ? '4' : '3');
      }
      params.set('sort', sortBy);
      params.set('page', currentPage.toString());
      params.set('limit', itemsPerPage.toString());

      try {
        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();

        if (cancelled) return;

        setProducts(data.products ?? []);
        setTotalProducts(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        if (data.filters?.categories) setCategories(data.filters.categories);
        if (data.filters?.brands) setBrands(data.filters.brands);
        if (data.filters?.priceRange?.max)
          setPriceMax(data.filters.priceRange.max);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    sortBy,
    currentPage,
    priceMax,
    itemsPerPage
  ]);

  // Sync state to URL (replace, not push — filters don't pollute history)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategories.length > 0)
      params.set('categories', selectedCategories.join(','));
    if (selectedBrands.length > 0)
      params.set('brands', selectedBrands.join(','));
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1].toString());
    if (selectedRating !== 'all') params.set('rating', selectedRating);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const newUrl = params.toString() ? `/products?${params}` : '/products';
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    sortBy,
    viewMode,
    currentPage
  ]);

  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      setSelectedCategories((prev) =>
        checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
      );
      setCurrentPage(1);
    },
    []
  );

  const handleBrandChange = useCallback((brandId: string, checked: boolean) => {
    setSelectedBrands((prev) =>
      checked ? [...prev, brandId] : prev.filter((id) => id !== brandId)
    );
    setCurrentPage(1);
  }, []);

  const handlePriceChange = useCallback((value: number[]) => {
    setPriceRange([value[0], value[1]]);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleRatingChange = useCallback((value: string) => {
    setSelectedRating(value);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 1000]);
    setSelectedRating('all');
    setSortBy('featured');
    setCurrentPage(1);
    router.push('/products');
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < priceMax ? 1 : 0) +
    (selectedRating !== 'all' ? 1 : 0);

  const renderProductContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Error loading products</h3>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (products.length === 0) {
      return <EmptyProductState onResetFilters={handleResetFilters} />;
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={{
                id: product._id,
                name: product.name,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                images: product.images,
                category: product.categoryId?.name,
                brand: product.brand,
                rating: product.rating,
                reviewCount: product.reviewCount,
                salesCount: product.salesCount,
                featured: product.featured,
                active: product.active,
                createdAt: product.createdAt,
                description: product.description,
                stock: product.stock
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <ProductList
        products={products}
        categories={categories}
        brands={brands}
      />
    );
  };

  return (
    <Container>
      <div className="flex flex-col gap-8 md:flex-row">
        <ProductFilters
          categories={categories.map((cat) => ({
            id: cat._id,
            name: cat.name,
            slug: cat.slug
          }))}
          brands={brands.map((b) => ({ id: b, name: b }))}
          selectedCategories={selectedCategories}
          selectedBrands={selectedBrands}
          priceRange={priceRange}
          priceMax={priceMax}
          searchQuery={searchQuery}
          selectedRating={selectedRating}
          showFilters={showFilters}
          activeFilterCount={activeFilterCount}
          onCategoryChange={handleCategoryChange}
          onBrandChange={handleBrandChange}
          onPriceChange={handlePriceChange}
          onSearchChange={setSearchQuery}
          onSearchSubmit={(e) => e.preventDefault()}
          onRatingChange={handleRatingChange}
          onResetFilters={handleResetFilters}
          onApplyFilters={() => setShowFilters(false)}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          onCloseFilters={() => setShowFilters(false)}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Loading products...'
                  : `Showing ${products.length} of ${totalProducts} products`}
              </p>
            </div>
            <ProductSorting
              sortBy={sortBy}
              viewMode={viewMode}
              sortOptions={sortOptions}
              onSortChange={handleSortChange}
              onViewModeChange={setViewMode}
            />
          </div>

          <ActiveFilters
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            priceRange={priceRange}
            categories={categories}
            brands={brands}
            onRemoveSearchQuery={() => setSearchQuery('')}
            onRemoveCategory={handleCategoryChange}
            onRemoveBrand={handleBrandChange}
            onResetPriceRange={() => setPriceRange([0, priceMax])}
            onResetAllFilters={handleResetFilters}
          />

          {renderProductContent()}

          {!isLoading && !error && products.length > 0 && (
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
