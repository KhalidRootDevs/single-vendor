'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterCategory {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

interface FilterBrand {
  id: string;
  name: string;
}

interface ActiveFiltersProps {
  searchQuery: string;
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: [number, number];
  categories: FilterCategory[];
  brands: (FilterBrand | string)[];
  onRemoveSearchQuery: () => void;
  onRemoveCategory: (categoryId: string, checked: boolean) => void;
  onRemoveBrand: (brandId: string, checked: boolean) => void;
  onResetPriceRange: () => void;
  onResetAllFilters: () => void;
}

export function ActiveFilters({
  searchQuery,
  selectedCategories,
  selectedBrands,
  priceRange,
  categories,
  brands,
  onRemoveSearchQuery,
  onRemoveCategory,
  onRemoveBrand,
  onResetPriceRange,
  onResetAllFilters
}: ActiveFiltersProps) {
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  if (activeFilterCount === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Active Filters:</span>

        {searchQuery && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onRemoveSearchQuery}
          >
            Search: {searchQuery}
            <X className="h-3 w-3" />
          </Button>
        )}

        {selectedCategories.map((slug) => {
          const category = categories.find(
            (c) => c.slug === slug || c.id === slug || c._id === slug
          );
          return (
            <Button
              key={slug}
              variant="secondary"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onRemoveCategory(slug, false)}
            >
              {category?.name ?? slug}
              <X className="h-3 w-3" />
            </Button>
          );
        })}

        {selectedBrands.map((brandId) => {
          const brand = brands.find((b) =>
            typeof b === 'string' ? b === brandId : b.id === brandId
          );
          const brandName =
            typeof brand === 'string' ? brand : brand?.name ?? brandId;
          return (
            <Button
              key={brandId}
              variant="secondary"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onRemoveBrand(brandId, false)}
            >
              {brandName}
              <X className="h-3 w-3" />
            </Button>
          );
        })}

        {(priceRange[0] > 0 || priceRange[1] < 1000) && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onResetPriceRange}
          >
            Price: ${priceRange[0]} - ${priceRange[1]}
            <X className="h-3 w-3" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onResetAllFilters}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
