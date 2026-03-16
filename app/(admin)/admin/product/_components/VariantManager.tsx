'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { ProductFormValues } from './schema';

type Attribute = {
  name: string;
  values: string[];
};

export function VariantManager() {
  const { control, register, watch, setValue, getValues } =
    useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants'
  });

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValues, setNewAttributeValues] = useState('');

  // Watch variants to update preview
  const variants = watch('variants');

  // Generate variants from attributes
  const generateVariantsFromAttributes = () => {
    if (attributes.length === 0) return;

    // Generate all combinations
    const combinations = attributes.reduce(
      (acc, attr) => {
        const values = attr.values.filter((v) => v.trim());
        if (values.length === 0) return acc;

        const newCombinations: Record<string, string>[] = [];

        if (acc.length === 0) {
          values.forEach((value) => {
            newCombinations.push({ [attr.name]: value });
          });
        } else {
          acc.forEach((combination) => {
            values.forEach((value) => {
              newCombinations.push({
                ...combination,
                [attr.name]: value
              });
            });
          });
        }

        return newCombinations;
      },
      [] as Record<string, string>[]
    );

    // Clear existing variants
    while (fields.length > 0) {
      remove(0);
    }

    // Add new variants
    combinations.forEach((combination) => {
      append({
        attributes: combination,
        price: undefined,
        stock: 0,
        sku: '',
        image: ''
      });
    });
  };

  const addAttribute = () => {
    if (newAttributeName && newAttributeValues) {
      const values = newAttributeValues.split(',').map((v) => v.trim());
      setAttributes([...attributes, { name: newAttributeName, values }]);
      setNewAttributeName('');
      setNewAttributeValues('');
    }
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Preview how variants will look on product page
  const VariantPreview = () => {
    if (fields.length === 0) return null;

    // Extract unique attribute types
    const attributeTypes = Array.from(
      new Set(
        fields.flatMap((field) =>
          field.attributes ? Object.keys(field.attributes) : []
        )
      )
    );

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Customer View Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {attributeTypes.map((attrType) => {
              // Get unique values for this attribute type
              const values = Array.from(
                new Set(
                  fields
                    .map((field) => field.attributes?.[attrType])
                    .filter(Boolean)
                )
              );

              return (
                <div key={attrType} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{attrType}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      // Check if this combination is valid with other selections
                      const isAvailable = true; // You can add logic here

                      return (
                        <Button
                          key={value}
                          variant="outline"
                          size="lg"
                          className="relative cursor-default opacity-100"
                        >
                          {value}
                          <Check className="ml-2 h-4 w-4 text-green-500" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {fields.length > 0 && (
              <div className="mt-4 rounded-md bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Variant Details:</p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {fields.map((field, index) => (
                    <div key={field.id} className="text-sm">
                      <span className="font-medium">Variant {index + 1}:</span>{' '}
                      {Object.entries(field.attributes || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                      {field.price && ` - $${field.price}`}
                      {field.stock > 0
                        ? ` - Stock: ${field.stock}`
                        : ' - Out of Stock'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Attribute Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Build Variant Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define your product attributes like Size, Color, Material. Add
            multiple values separated by commas.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Attribute Name</Label>
              <Input
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                placeholder="e.g., Color, Size"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Values (comma-separated)</Label>
              <div className="flex gap-2">
                <Input
                  value={newAttributeValues}
                  onChange={(e) => setNewAttributeValues(e.target.value)}
                  placeholder="Red, Blue, Green or S, M, L"
                  className="flex-1"
                />
                <Button type="button" onClick={addAttribute}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Display Added Attributes */}
          {attributes.length > 0 && (
            <div className="mt-4">
              <Label>Added Attributes</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
                  >
                    <span className="font-medium">{attr.name}:</span>
                    <span className="text-sm">{attr.values.join(', ')}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeAttribute(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={generateVariantsFromAttributes}
                className="mt-4"
              >
                Generate All Variants
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Variant Addition */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Variants ({fields.length})</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              attributes: {},
              price: undefined,
              stock: 0,
              sku: '',
              image: ''
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Single Variant
        </Button>
      </div>

      {/* Variants List */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-start justify-between">
                <h4 className="font-medium">Variant {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Dynamic Attributes for this variant */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Attributes</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const attrName = prompt(
                        'Enter attribute name (e.g., Color):'
                      );
                      if (attrName) {
                        const attrValue = prompt(
                          `Enter value for ${attrName}:`
                        );
                        if (attrValue) {
                          const currentVariants = getValues('variants');
                          if (!currentVariants[index].attributes) {
                            currentVariants[index].attributes = {};
                          }
                          currentVariants[index].attributes[attrName] =
                            attrValue;
                          setValue('variants', [...currentVariants]);
                        }
                      }
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Attribute
                  </Button>
                </div>

                {/* Display existing attributes */}
                {field.attributes &&
                Object.keys(field.attributes).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(field.attributes).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1 rounded-md bg-muted px-2 py-1"
                      >
                        <span className="text-sm font-medium">{key}:</span>
                        <span className="text-sm">{value as string}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-5 w-5"
                          onClick={() => {
                            const currentVariants = getValues('variants');
                            delete currentVariants[index].attributes[key];
                            setValue('variants', [...currentVariants]);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No attributes for this variant. Add attributes to define
                    this variant.
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Variant Details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Price (optional)</Label>
                  <Input
                    type="number"
                    {...register(`variants.${index}.price` as const, {
                      valueAsNumber: true
                    })}
                    placeholder="Override price"
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    {...register(`variants.${index}.stock` as const, {
                      valueAsNumber: true
                    })}
                    placeholder="Variant stock"
                    defaultValue={0}
                  />
                </div>
                <div>
                  <Label>SKU (optional)</Label>
                  <Input
                    {...register(`variants.${index}.sku` as const)}
                    placeholder="Variant SKU"
                  />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    {...register(`variants.${index}.image` as const)}
                    placeholder="Variant image"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Section */}
      <VariantPreview />
    </div>
  );
}
