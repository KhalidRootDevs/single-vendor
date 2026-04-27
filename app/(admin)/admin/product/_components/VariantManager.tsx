'use client';

import { useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageFile } from '@/components/custom/product-image-upload';
import { cn } from '@/lib/utils';
import { generateVariantSku } from './sku-utils';
import {
  Plus,
  Trash2,
  X,
  Wand2,
  Upload,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { ProductFormValues } from './schema';

type Attribute = { name: string; values: string[] };

export function VariantManager() {
  const { control, register, watch, setValue, getValues } =
    useFormContext<ProductFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants'
  });

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attrName, setAttrName] = useState('');
  const [attrValues, setAttrValues] = useState('');

  // Shared hidden file input for variant image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeVariantRef = useRef<number>(-1);

  const productImages: ImageFile[] = (watch('images') as ImageFile[]) ?? [];
  const baseSku = watch('sku') ?? '';

  // ── Attribute builder ──────────────────────────────────────────────────────

  const addAttribute = () => {
    const name = attrName.trim();
    const values = attrValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!name || values.length === 0) return;
    setAttributes((prev) => [...prev, { name, values }]);
    setAttrName('');
    setAttrValues('');
  };

  const removeAttribute = (i: number) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));

  const generateVariants = () => {
    if (attributes.length === 0) return;

    // Cartesian product of all attribute values
    const combinations = attributes.reduce(
      (acc: Record<string, string>[], attr) => {
        const vals = attr.values.filter(Boolean);
        if (vals.length === 0) return acc;
        if (acc.length === 0) return vals.map((v) => ({ [attr.name]: v }));
        return acc.flatMap((combo) =>
          vals.map((v) => ({ ...combo, [attr.name]: v }))
        );
      },
      []
    );

    // Remove all existing variants
    for (let i = fields.length - 1; i >= 0; i--) remove(i);

    // Append new ones
    combinations.forEach((combo) => {
      append({
        attributes: combo,
        price: undefined,
        stock: 0,
        sku: baseSku ? generateVariantSku(baseSku, combo) : '',
        image: undefined
      });
    });
  };

  // ── Variant image selection ────────────────────────────────────────────────

  const selectVariantImage = (
    variantIdx: number,
    preview: string | undefined
  ) => {
    setValue(`variants.${variantIdx}.image`, preview, { shouldDirty: true });
  };

  const handleVariantImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeVariantRef.current < 0) return;

    const imageFile: ImageFile = Object.assign(file, {
      preview: URL.createObjectURL(file)
    });

    // Add to product images array
    const current = (getValues('images') as ImageFile[]) ?? [];
    const newIndex = current.length;
    setValue('images', [...current, imageFile], { shouldDirty: true });

    // Set as variant's image
    selectVariantImage(activeVariantRef.current, imageFile.preview);

    // Reset input so the same file can be selected again if needed
    e.target.value = '';
    activeVariantRef.current = -1;
  };

  const triggerVariantUpload = (variantIdx: number) => {
    activeVariantRef.current = variantIdx;
    fileInputRef.current?.click();
  };

  const regenVariantSku = (idx: number) => {
    const attrs = getValues(`variants.${idx}.attributes`);
    const sku = baseSku ? generateVariantSku(baseSku, attrs) : '';
    setValue(`variants.${idx}.sku`, sku, { shouldDirty: true });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Hidden file input for variant image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleVariantImageFile}
      />

      {/* ── Attribute builder ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Build Variant Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define attributes like Size, Color, Material. Values
            comma-separated.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Attribute Name</Label>
              <Input
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
                placeholder="e.g. Color, Size"
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addAttribute())
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Values (comma-separated)</Label>
              <div className="flex gap-2">
                <Input
                  value={attrValues}
                  onChange={(e) => setAttrValues(e.target.value)}
                  placeholder="Red, Blue, Green  or  S, M, L, XL"
                  className="flex-1"
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addAttribute())
                  }
                />
                <Button
                  type="button"
                  onClick={addAttribute}
                  disabled={!attrName || !attrValues}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {attributes.length > 0 && (
            <div className="space-y-3">
              <Label>Added Attributes</Label>
              <div className="flex flex-wrap gap-2">
                {attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5"
                  >
                    <span className="text-sm font-medium">{attr.name}:</span>
                    <span className="text-sm">{attr.values.join(', ')}</span>
                    <button
                      type="button"
                      onClick={() => removeAttribute(i)}
                      className="ml-1 rounded text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={generateVariants}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Generate All Variants
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ── Variants list ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Variants{' '}
          <span className="text-sm font-normal text-muted-foreground">
            ({fields.length})
          </span>
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              attributes: {},
              price: undefined,
              stock: 0,
              sku: '',
              image: undefined
            })
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No variants yet. Use the attribute builder above or add one manually.
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field, idx) => {
          const currentImage = watch(`variants.${idx}.image`);

          return (
            <Card key={field.id}>
              <CardContent className="pt-6">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Variant {idx + 1}</span>
                    {field.attributes &&
                      Object.entries(field.attributes).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-xs">
                          {k}: {v as string}
                        </Badge>
                      ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* ── Core fields ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>SKU</Label>
                    <div className="mt-1 flex gap-1.5">
                      <Input
                        {...register(`variants.${idx}.sku`)}
                        placeholder="Auto or manual"
                        className="flex-1 font-mono text-sm"
                      />
                      {baseSku && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          title="Regenerate variant SKU"
                          onClick={() => regenVariantSku(idx)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Price Override</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`variants.${idx}.price`, {
                          valueAsNumber: true
                        })}
                        placeholder="Base price"
                        className="pl-6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      {...register(`variants.${idx}.stock`, {
                        valueAsNumber: true
                      })}
                      placeholder="0"
                      defaultValue={0}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* ── Image picker ─────────────────────────────────────── */}
                <div>
                  <Label className="mb-2 block">
                    Variant Image
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      — select from gallery or upload a new one
                    </span>
                  </Label>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* None option */}
                    <button
                      type="button"
                      onClick={() => selectVariantImage(idx, undefined)}
                      className={cn(
                        'flex h-16 w-16 shrink-0 items-center justify-center rounded-md border-2 text-xs text-muted-foreground transition-colors',
                        !currentImage
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-dashed border-border hover:border-muted-foreground'
                      )}
                    >
                      None
                    </button>

                    {/* Product gallery thumbnails */}
                    {productImages.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Upload product images first to select here.
                      </p>
                    )}

                    {productImages.map((file, imgIdx) => (
                      <button
                        key={file.preview}
                        type="button"
                        onClick={() => selectVariantImage(idx, file.preview)}
                        title={file.name}
                        className={cn(
                          'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all',
                          currentImage === file.preview
                            ? 'border-primary ring-2 ring-primary ring-offset-1'
                            : 'border-border hover:border-primary/60'
                        )}
                      >
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                        {imgIdx === 0 && (
                          <span className="absolute left-0.5 top-0.5 rounded bg-primary/80 px-0.5 text-[9px] text-white">
                            Main
                          </span>
                        )}
                        {currentImage === file.preview && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <div className="rounded-full bg-primary p-0.5">
                              <svg
                                viewBox="0 0 10 10"
                                className="h-3 w-3 text-white"
                                fill="currentColor"
                              >
                                <path
                                  d="M2 5l2.5 2.5L8 3"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Upload new variant image */}
                    <button
                      type="button"
                      onClick={() => triggerVariantUpload(idx)}
                      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </button>
                  </div>

                  {/* Current selection preview */}
                  {currentImage && (
                    <div className="mt-3 flex items-center gap-2">
                      <img
                        src={currentImage}
                        alt="Selected variant image"
                        className="h-10 w-10 rounded border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">Selected</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {productImages.find((f) => f.preview === currentImage)
                            ?.name ?? 'Custom image'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => selectVariantImage(idx, undefined)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      {fields.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="mb-2 text-sm font-medium">
              {fields.length} variant{fields.length !== 1 ? 's' : ''} configured
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {fields.map((f, i) => {
                const v = watch(`variants.${i}`);
                const label = Object.entries(f.attributes ?? {})
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(', ');
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 text-xs text-muted-foreground"
                  >
                    {v?.image ? (
                      <img
                        src={v.image}
                        alt=""
                        className="h-5 w-5 rounded border object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-border" />
                    )}
                    <span className="font-medium text-foreground">
                      {label || `Variant ${i + 1}`}
                    </span>
                    {v?.sku && <code className="text-[10px]">{v.sku}</code>}
                    <span className="ml-auto">
                      {v?.price !== undefined
                        ? `$${Number(v.price).toFixed(2)}`
                        : 'Base price'}
                      {' · '}
                      {v?.stock ?? 0} in stock
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
