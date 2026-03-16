'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
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
  Search,
  Layers
} from 'lucide-react';
import { ProductFormValues, productSchema } from './schema';

import InputField from '../../../../../components/custom/input';
import { VariantManager } from './VariantManager';

// Step configuration
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
    resolver: zodResolver(productSchema),
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
      seo: {
        title: '',
        description: '',
        keywords: ''
      },
      images: []
    },
    mode: 'onChange'
  });

  const {
    handleSubmit,
    trigger,
    formState: { errors, isValid }
  } = methods;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (response.ok) {
          const formattedCategories = data.categories.map((cat: any) => ({
            value: cat._id,
            label: cat.name
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
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

  const nextStep = async () => {
    // Validate fields for current step
    let fieldsToValidate: (keyof ProductFormValues)[] = [];

    switch (currentStep) {
      case 0: // Basic Info
        fieldsToValidate = ['name', 'description', 'categoryId', 'tags'];
        break;
      case 1: // Pricing & Stock
        fieldsToValidate = [
          'price',
          'compareAtPrice',
          'cost',
          'sku',
          'barcode',
          'stock'
        ];
        break;
      case 2: // Shipping
        fieldsToValidate = ['weight', 'length', 'width', 'height'];
        break;
      case 3: // Variants
        fieldsToValidate = ['variants'];
        break;
      case 4: // Images & SEO
        fieldsToValidate = ['images', 'seo'];
        break;
      case 5: // Status
        fieldsToValidate = ['active', 'featured'];
        break;
    }

    const isValid = await trigger(fieldsToValidate as any);

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (
          key !== 'variants' &&
          key !== 'seo' &&
          key !== 'images' &&
          key !== 'tags'
        ) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
      });

      // Append tags
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      // Append variants
      if (data.variants && data.variants.length > 0) {
        formData.append('variants', JSON.stringify(data.variants));
      }

      // Append SEO
      if (data.seo) {
        formData.append('seo', JSON.stringify(data.seo));
      }

      // Append images
      if (data.images && data.images.length > 0) {
        data.images.forEach((file) => {
          formData.append('images', file);
        });
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
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
    } catch (error) {
      console.error('Error creating product:', error);
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
    <div className=" py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the details below to create a new product
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{steps[currentStep].title}</span>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max space-x-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Button
                key={step.id}
                variant={index === currentStep ? 'default' : 'ghost'}
                className="flex items-center gap-2"
                onClick={() => {
                  if (index < currentStep) {
                    setCurrentStep(index);
                  }
                }}
                disabled={index > currentStep}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
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

              {/* Step 2: Pricing & Stock */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="price"
                      label="Price"
                      placeholder="0.00"
                      type="number"
                      required
                    />

                    <InputField
                      name="compareAtPrice"
                      label="Compare at Price"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InputField
                      name="cost"
                      label="Cost"
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
                    <InputField
                      name="sku"
                      label="SKU"
                      placeholder="Enter SKU"
                      type="text"
                    />

                    <InputField
                      name="barcode"
                      label="Barcode"
                      placeholder="Enter barcode"
                      type="text"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Shipping */}
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

              {/* Step 4: Variants */}
              {currentStep === 3 && <VariantManager />}

              {/* Step 5: Images & SEO */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <InputField
                    name="images"
                    label="Product Images"
                    type="image"
                    required
                  />

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

              {/* Step 6: Status */}
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
