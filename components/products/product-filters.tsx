'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface FilterBrand {
  id: string;
  name: string;
  count?: number;
}

interface ProductFiltersProps {
  categories: FilterCategory[];
  brands: FilterBrand[];
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: [number, number];
  priceMax?: number;
  searchQuery: string;
  selectedRating: string;
  showFilters: boolean;
  activeFilterCount: number;
  onCategoryChange: (categorySlug: string, checked: boolean) => void;
  onBrandChange: (brandId: string, checked: boolean) => void;
  onPriceChange: (value: number[]) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRatingChange: (value: string) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
}

export function ProductFilters({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  priceRange,
  priceMax = 1000,
  searchQuery,
  selectedRating,
  showFilters,
  activeFilterCount,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onSearchChange,
  onSearchSubmit,
  onRatingChange,
  onResetFilters,
  onApplyFilters,
  onToggleFilters,
  onCloseFilters
}: ProductFiltersProps) {
  const [expandedFilters, setExpandedFilters] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true
  });

  const toggleSection = (section: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Search
        </h3>
        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </form>
      </div>

      {/* Price Range */}
      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => toggleSection('price')}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Price Range
          </h3>
          {expandedFilters.price ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedFilters.price && (
          <div className="mt-4 px-1">
            <Slider
              value={priceRange}
              max={priceMax}
              step={Math.max(1, Math.floor(priceMax / 100))}
              onValueChange={onPriceChange}
              className="mb-4"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                ${priceRange[0].toLocaleString()}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="font-medium">
                ${priceRange[1].toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => toggleSection('categories')}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h3>
          {expandedFilters.categories ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedFilters.categories && (
          <div className="mt-3 space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories found
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={(checked) =>
                      onCategoryChange(category.slug, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                  >
                    {category.name}
                    {category.count != null && (
                      <span className="text-xs text-muted-foreground">
                        ({category.count})
                      </span>
                    )}
                  </Label>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => toggleSection('brands')}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Brands
            </h3>
            {expandedFilters.brands ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedFilters.brands && (
            <div className="mt-3 space-y-2">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={(checked) =>
                      onBrandChange(brand.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`brand-${brand.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                  >
                    {brand.name}
                    {brand.count != null && (
                      <span className="text-xs text-muted-foreground">
                        ({brand.count})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => toggleSection('rating')}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </h3>
          {expandedFilters.rating ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedFilters.rating && (
          <div className="mt-3">
            <RadioGroup value={selectedRating} onValueChange={onRatingChange}>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="all" id="rating-all" />
                <Label htmlFor="rating-all" className="cursor-pointer text-sm">
                  All Ratings
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="4plus" id="rating-4plus" />
                <Label
                  htmlFor="rating-4plus"
                  className="cursor-pointer text-sm"
                >
                  4★ &amp; Above
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="3plus" id="rating-3plus" />
                <Label
                  htmlFor="rating-3plus"
                  className="cursor-pointer text-sm"
                >
                  3★ &amp; Above
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="mb-4 md:hidden">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onToggleFilters}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile drawer — backdrop + slide-in panel */}
      {showFilters && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onCloseFilters}
          aria-hidden
        />
      )}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 max-w-full transform bg-background shadow-xl
          transition-transform duration-300 ease-in-out md:hidden
          ${showFilters ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({activeFilterCount} active)
                </span>
              )}
            </h2>
            <Button variant="ghost" size="icon" onClick={onCloseFilters}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close filters</span>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filterContent}</div>
          <div className="flex gap-2 border-t p-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onResetFilters}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={onApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar — scrolls independently of the product grid, so a long
          category/brand list never pushes the action buttons out of reach. */}
      <div className="hidden w-64 flex-shrink-0 md:block">
        <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col">
          {/* min-h-0 lets this shrink below its content height so it can scroll */}
          <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-2">
            {filterContent}
          </div>
          <div className="flex flex-col gap-2 border-t bg-background pt-4">
            <Button className="w-full" onClick={onApplyFilters}>
              Apply Filters
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onResetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
