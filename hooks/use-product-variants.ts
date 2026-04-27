'use client';

import { useCallback, useMemo, useState } from 'react';
import { GroupedVariant, ProductVariant } from '@/types';

interface UseProductVariantsReturn {
  groupedVariants: GroupedVariant[];
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant | null;
  effectivePrice: number;
  effectiveStock: number;
  effectiveImage: string;
  isInStock: boolean;
  areAllSelected: boolean;
  handleSelect: (name: string, option: string) => void;
  isOptionInvalid: (name: string, option: string) => boolean;
  isOptionOos: (name: string, option: string) => boolean;
  formatSelected: () => string;
}

function buildInitialOptions(
  variants: ProductVariant[] | undefined,
  baseStock: number
): Record<string, string> {
  if (!variants?.length) return {};
  const firstInStock = variants.find((v) => (v.stock ?? baseStock) > 0);
  return { ...(firstInStock ?? variants[0]).attributes };
}

export function useProductVariants(
  variants: ProductVariant[] | undefined,
  basePrice: number,
  baseStock: number,
  baseImages: string[]
): UseProductVariantsReturn {
  const groupedVariants = useMemo((): GroupedVariant[] => {
    if (!variants?.length) return [];

    const attributeMap: Record<string, Set<string>> = {};
    const priceVariation: Record<string, boolean> = {};
    const stockVariation: Record<string, boolean> = {};

    for (const variant of variants) {
      for (const [key, value] of Object.entries(variant.attributes)) {
        if (!attributeMap[key]) attributeMap[key] = new Set();
        attributeMap[key].add(value);
        if (variant.price !== undefined && variant.price !== basePrice) {
          priceVariation[key] = true;
        }
        if (variant.stock !== undefined && variant.stock !== baseStock) {
          stockVariation[key] = true;
        }
      }
    }

    return Object.entries(attributeMap).map(([name, optionsSet]) => ({
      name,
      options: Array.from(optionsSet),
      hasPriceVariation: priceVariation[name] ?? false,
      hasStockVariation: stockVariation[name] ?? false
    }));
  }, [variants, basePrice, baseStock]);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => buildInitialOptions(variants, baseStock));

  const selectedVariant = useMemo(() => {
    if (!variants?.length || !Object.keys(selectedOptions).length) return null;
    return (
      variants.find((v) =>
        Object.entries(selectedOptions).every(
          ([k, val]) => v.attributes[k] === val
        )
      ) ?? null
    );
  }, [variants, selectedOptions]);

  const effectivePrice = selectedVariant?.price ?? basePrice;
  const effectiveStock = selectedVariant?.stock ?? baseStock;
  const effectiveImage =
    (selectedVariant?.image
      ? baseImages.find((img) => img === selectedVariant.image)
      : undefined) ??
    baseImages[0] ??
    '/placeholder.svg';
  const isInStock = effectiveStock > 0;
  const areAllSelected = groupedVariants.every(
    (g) => !!selectedOptions[g.name]
  );

  const handleSelect = useCallback((name: string, option: string) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: option }));
  }, []);

  const isOptionInvalid = useCallback(
    (name: string, option: string): boolean => {
      if (!variants?.length) return false;
      const testOptions = { ...selectedOptions, [name]: option };
      return !variants.some((v) =>
        Object.entries(testOptions).every(([k, val]) => v.attributes[k] === val)
      );
    },
    [variants, selectedOptions]
  );

  const isOptionOos = useCallback(
    (name: string, option: string): boolean => {
      if (!variants?.length) return false;
      const testOptions = { ...selectedOptions, [name]: option };
      const match = variants.find((v) =>
        Object.entries(testOptions).every(([k, val]) => v.attributes[k] === val)
      );
      if (!match) return false;
      return (match.stock ?? baseStock) === 0;
    },
    [variants, selectedOptions, baseStock]
  );

  const formatSelected = useCallback(
    () =>
      Object.entries(selectedOptions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
    [selectedOptions]
  );

  return {
    groupedVariants,
    selectedOptions,
    selectedVariant,
    effectivePrice,
    effectiveStock,
    effectiveImage,
    isInStock,
    areAllSelected,
    handleSelect,
    isOptionInvalid,
    isOptionOos,
    formatSelected
  };
}
