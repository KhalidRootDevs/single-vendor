'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Package,
  DollarSign,
  Truck,
  Settings,
  Image as ImageIcon,
  Layers,
  Wand2
} from 'lucide-react';
import { ProductFormValues, productSchema } from './schema';
import { generateBaseSku } from './sku-utils';
import {
  ProductImageUpload,
  type ImageFile
} from '@/components/custom/product-image-upload';
import InputField from '../../../../../components/custom/input';
import { VariantManager } from './VariantManager';

const steps = [
  { id: 'basic', title: 'Basic Info', icon: Package },
  { id: 'pricing', title: 'Pricing & Stock', icon: DollarSign },
  { id: 'shipping', title: 'Shipping', icon: Truck },
  { id: 'variants', title: 'Variants', icon: Layers },
  { id: 'images', title: 'Images & SEO', icon: ImageIcon },
  { id: 'status', title: 'Status', icon: Settings }
];

export default function CreateProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      tags: [],
      price: 0,
      compareAtPrice: undefined,
      cost: undefined,
      sku: '',
      barcode: '',
      stock: 0,
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      active: true,
      featured: false,
      variants: [],
      seo: { title: '', description: '', keywords: '' },
      images: []
    },
    mode: 'onChange'
  });

  const {
    handleSubmit,
    trigger,
    register,
    watch,
    setValue,
    formState: { errors }
  } = methods;

  const productName = watch('name');
  const currentSku = watch('sku');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (res.ok) {
          setCategories(
            data.categories.map((cat: any) => ({
              value: cat._id,
              label: cat.name
            }))
          );
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive'
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleGenerateSku = () => {
    if (!productName) {
      toast({ title: 'Enter a product name first', variant: 'destructive' });
      return;
    }
    setValue('sku', generateBaseSku(productName), { shouldDirty: true });
  };

  const nextStep = async () => {
    const fieldMap: Record<number, (keyof ProductFormValues)[]> = {
      0: ['name', 'description', 'categoryId', 'tags'],
      1: ['price', 'compareAtPrice', 'cost', 'sku', 'barcode', 'stock'],
      2: ['weight', 'length', 'width', 'height'],
      3: ['variants'],
      4: ['images', 'seo'],
      5: ['active', 'featured']
    };

    const valid = await trigger(fieldMap[currentStep] as any);
    if (valid && currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo(0, 0);
    } else if (!valid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Scalar fields
      const scalars = Object.entries(data).filter(
        ([k]) => !['variants', 'seo', 'images', 'tags'].includes(k)
      );
      scalars.forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v));
      });

      if (data.tags?.length) formData.append('tags', JSON.stringify(data.tags));
      if (data.seo) formData.append('seo', JSON.stringify(data.seo));

      // Build preview → index map for resolving variant image references
      const images = (data.images as ImageFile[]) ?? [];
      const previewToIdx = new Map(images.map((f, i) => [f.preview, i]));

      // Encode variant image as __img:N__ reference
      const variantsPayload = (data.variants ?? []).map((v) => {
        let image: string | undefined = undefined;
        if (v.image && previewToIdx.has(v.image)) {
          image = `__img:${previewToIdx.get(v.image)}__`;
        }
        return { ...v, image };
      });

      if (variantsPayload.length > 0) {
        formData.append('variants', JSON.stringify(variantsPayload));
      }

      // Upload product images in the user's chosen order
      images.forEach((file) => formData.append('images', file));

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Product created successfully'
        });
        router.push('/admin/products');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create product',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the details below to create a new product
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{steps[currentStep].title}</span>
        </div>
      </div>

      {/* Step tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Button
                key={step.id}
                variant={i === currentStep ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit as any)}>
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ── Step 1: Basic Info ─────────────────────────────────── */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <InputField
                    name="name"
                    label="Product Name"
                    placeholder="Enter product name"
                    type="text"
                    required
                  />
                  <InputField
                    name="description"
                    label="Description"
                    placeholder="Enter product description"
                    type="textarea"
                    rowCount={5}
                    required
                  />
                  <InputField
                    name="categoryId"
                    label="Category"
                    placeholder="Select a category"
                    type="select"
                    options={categories}
                    required
                  />
                  <InputField
                    name="tags"
                    label="Tags"
                    placeholder="Select tags"
                    type="react-select-multi"
                    options={[
                      { value: 'new', label: 'New' },
                      { value: 'featured', label: 'Featured' },
                      { value: 'sale', label: 'Sale' },
                      { value: 'bestseller', label: 'Bestseller' },
                      { value: 'limited', label: 'Limited Edition' }
                    ]}
                  />
                </div>
              )}

              {/* ── Step 2: Pricing & Stock ────────────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="price"
                      label="Price ($)"
                      placeholder="0.00"
                      type="number"
                      required
                    />
                    <InputField
                      name="compareAtPrice"
                      label="Compare at Price ($)"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="cost"
                      label="Cost ($)"
                      placeholder="0.00"
                      type="number"
                    />
                    <InputField
                      name="stock"
                      label="Stock"
                      placeholder="0"
                      type="number"
                      required
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* SKU with auto-generate */}
                    <div className="space-y-2">
                      <Label htmlFor="sku">
                        SKU
                        {currentSku && (
                          <code className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                            {currentSku}
                          </code>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="sku"
                          {...register('sku')}
                          placeholder="Auto-generate or enter manually"
                          className="flex-1 font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateSku}
                          title={
                            productName
                              ? `Generate from "${productName}"`
                              : 'Enter a product name first'
                          }
                          className="shrink-0 gap-1.5"
                        >
                          <Wand2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Generate</span>
                        </Button>
                      </div>
                      {!productName && (
                        <p className="text-xs text-muted-foreground">
                          Enter a product name in step 1 to auto-generate SKU.
                        </p>
                      )}
                      {productName && !currentSku && (
                        <p className="text-xs text-muted-foreground">
                          Will generate:{' '}
                          <code>{generateBaseSku(productName)}</code> (preview)
                        </p>
                      )}
                      {errors.sku && (
                        <p className="text-sm text-destructive">
                          {errors.sku.message}
                        </p>
                      )}
                    </div>

                    <InputField
                      name="barcode"
                      label="Barcode"
                      placeholder="Enter barcode"
                      type="text"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 3: Shipping ───────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="weight"
                      label="Weight (kg)"
                      placeholder="0.00"
                      type="number"
                    />
                    <InputField
                      name="length"
                      label="Length (cm)"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="width"
                      label="Width (cm)"
                      placeholder="0.00"
                      type="number"
                    />
                    <InputField
                      name="height"
                      label="Height (cm)"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 4: Variants ───────────────────────────────────── */}
              {currentStep === 3 && <VariantManager />}

              {/* ── Step 5: Images & SEO ──────────────────────────────── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block text-base font-medium">
                      Product Images <span className="text-destructive">*</span>
                    </Label>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Upload one or more images. Drag to reorder — the first
                      image is shown as the main product image.
                    </p>
                    <ProductImageUpload name="images" />
                    {errors.images && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.images.message as string}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">SEO Settings</h3>
                    <InputField
                      name="seo.title"
                      label="SEO Title"
                      placeholder="Enter SEO title (max 60 characters)"
                      type="text"
                    />
                    <InputField
                      name="seo.description"
                      label="SEO Description"
                      placeholder="Enter SEO description (max 160 characters)"
                      type="textarea"
                      rowCount={3}
                    />
                    <InputField
                      name="seo.keywords"
                      label="SEO Keywords"
                      placeholder="Enter keywords separated by commas"
                      type="text"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 6: Status ─────────────────────────────────────── */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <InputField name="active" label="Active" type="switch" />
                  <InputField name="featured" label="Featured" type="switch" />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep === steps.length - 1 ? (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
