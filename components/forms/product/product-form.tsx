"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import ProductAdditionalImage from "./product-additional-image";
import ProductBasicInfo from "./product-basic-info";
import ProductMainImage from "./product-main-image";
import ProductSeo from "./product-seo";
import ProductShippingInfo from "./product-shipping-Info";
import ProductVariant from "./product-variant";

const productSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Product name must be at least 2 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce
    .number()
    .positive({ message: "Price must be a positive number" }),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  cost: z.coerce.number().positive().optional().nullable(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string({ required_error: "Please select a category" }),
  tags: z.array(z.string()).optional(),
  stock: z.coerce
    .number()
    .int()
    .nonnegative({ message: "Stock must be a non-negative integer" }),
  weight: z.coerce.number().positive().optional().nullable(),
  length: z.coerce.number().positive().optional().nullable(),
  width: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  brand: z.string().optional(),
  active: z.boolean().default(true).optional(),
  featured: z.boolean().default(true).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().optional(),
        attributes: z
          .record(z.string())
          .refine((attrs) => Object.keys(attrs).length > 0, {
            message: "At least one attribute is required",
          }),
        price: z.coerce.number().positive().optional().nullable(),
        stock: z.coerce.number().int().nonnegative().optional().nullable(),
        image: z.string().optional(),
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
    })
    .optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: { _id: string; name: string } | null;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  categoryId: string | Category;
  tags: string[];
  stock: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  brand?: string;
  active: boolean;
  featured: boolean;
  variants: Array<{
    sku?: string;
    attributes: Record<string, string>;
    price?: number;
    stock?: number;
    image?: string;
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductFormProps {
  product?: Product | null;
  isEditing?: boolean;
  onSuccess?: () => void;
}

// Mock tags for the checkboxes
const tags = [
  { id: "featured", label: "Featured" },
  { id: "best-selling", label: "Best Selling" },
  { id: "new-arrival", label: "New Arrival" },
  { id: "top-rated", label: "Top Rated" },
  { id: "sale", label: "Sale" },
];

// Common variant attributes
const commonAttributes = [
  { value: "size", label: "Size" },
  { value: "color", label: "Color" },
  { value: "material", label: "Material" },
  { value: "style", label: "Style" },
  { value: "weight", label: "Weight" },
  { value: "capacity", label: "Capacity" },
  { value: "pattern", label: "Pattern" },
  { value: "finish", label: "Finish" },
];

export function ProductForm({
  product,
  isEditing = false,
  onSuccess,
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      compareAtPrice: undefined,
      cost: undefined,
      sku: "",
      barcode: "",
      categoryId: "",
      tags: [],
      stock: 0,
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      brand: "",
      active: true,
      featured: false,
      variants: [],
      seo: {
        title: "",
        description: "",
        keywords: "",
      },
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = methods;

  const { fields, append } = useFieldArray({
    control,
    name: "variants",
  });

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        throw new Error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Initialize form with product data when editing
  useEffect(() => {
    fetchCategories();

    if (product && isEditing) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice || undefined,
        cost: product.cost || undefined,
        sku: product.sku,
        barcode: product.barcode || "",
        categoryId:
          typeof product.categoryId === "string"
            ? product.categoryId
            : product.categoryId?._id,
        tags: product.tags || [],
        stock: product.stock,
        weight: product.weight || undefined,
        length: product.length || undefined,
        width: product.width || undefined,
        height: product.height || undefined,
        brand: product.brand || "",
        active: product.active,
        featured: product.featured,
        variants: product.variants || [],
        seo: product.seo || {
          title: "",
          description: "",
          keywords: "",
        },
      });

      // Set images - track existing vs new
      if (product.images && product.images.length > 0) {
        setMainImage(product.images[0]);
        setAdditionalImages(product.images.slice(1));
        setAvailableImages(product.images);
        setExistingImages(product.images);
        setImagesToDelete([]);
      }
    }
  }, [product, isEditing, reset]);

  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const newFiles: File[] = [];

      Array.from(files).forEach((file) => {
        // Validate file type and size
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: "Please upload image files only.",
            variant: "destructive",
          });
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please upload images smaller than 2MB.",
            variant: "destructive",
          });
          return;
        }

        newFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setAdditionalImages((prev) => [...prev, ...newImages]);
              setImageFiles((prev) => [...prev, ...newFiles]);
              setAvailableImages((prev) => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number, imageUrl?: string) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAvailableImages((prev) => prev.filter((_, i) => i !== index + 1));
    
    // Track deletion of existing images
    if (imageUrl && existingImages.includes(imageUrl)) {
      setImagesToDelete((prev) => [...prev, imageUrl]);
    }
  };

  const restoreImage = (imageUrl: string) => {
    if (imagesToDelete.includes(imageUrl)) {
      setImagesToDelete((prev) => prev.filter((img) => img !== imageUrl));
      setAdditionalImages((prev) => [...prev, imageUrl]);
      setAvailableImages((prev) => [...prev, imageUrl]);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!mainImage && !isEditing) {
      toast({
        title: "Image required",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append all form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === "variants" || key === "seo" || key === "tags") {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Append new images
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images", file);
        });
      }
      
      // For updates, track which images to delete
      if (isEditing && imagesToDelete.length > 0) {
        formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
      } else if (isEditing && imageFiles.length === 0) {
        // If no new images, keep all existing except deleted ones
        const imagesToKeep = existingImages.filter(
          (img) => !imagesToDelete.includes(img)
        );
        if (imagesToKeep.length > 0) {
          formData.append("imagesToKeep", JSON.stringify(imagesToKeep));
        }
      }

      const url =
        isEditing && product
          ? `/api/admin/products/${product._id}`
          : "/api/admin/products";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: isEditing ? "Product updated" : "Product created",
          description: `Product "${data.name}" has been ${
            isEditing ? "updated" : "created"
          } successfully.`,
        });

        // Reset form if creating new
        if (!isEditing) {
          reset();
          setMainImage("");
          setAdditionalImages([]);
          setImageFiles([]);
          setAvailableImages([]);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditing ? "update" : "create"} product`
        );
      }
    } catch (error: any) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} product:`,
        error
      );
      toast({
        title: "Error",
        description:
          error.message ||
          `Failed to ${
            isEditing ? "update" : "create"
          } product. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariant = () => {
    append({
      sku: "",
      attributes: {},
      price: undefined,
      stock: undefined,
      image: "",
    });
  };

  const addAttributeToVariant = (
    variantIndex: number,
    attributeName: string
  ) => {
    const currentAttributes =
      watch(`variants.${variantIndex}.attributes`) || {};
    setValue(`variants.${variantIndex}.attributes`, {
      ...currentAttributes,
      [attributeName]: "",
    });
  };

  const removeAttributeFromVariant = (
    variantIndex: number,
    attributeName: string
  ) => {
    const currentAttributes = {
      ...watch(`variants.${variantIndex}.attributes`),
    };
    delete currentAttributes[attributeName];
    setValue(`variants.${variantIndex}.attributes`, currentAttributes);
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attributeName: string,
    value: string
  ) => {
    const currentAttributes = {
      ...watch(`variants.${variantIndex}.attributes`),
    };
    setValue(`variants.${variantIndex}.attributes`, {
      ...currentAttributes,
      [attributeName]: value,
    });
  };

  const pageTitle = isEditing ? "Edit Product" : "Create Product";
  const pageDescription = isEditing
    ? "Update the product information."
    : "Add a new product to your store.";
  const submitButtonText = isEditing ? "Update Product" : "Create Product";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <ProductBasicInfo
                isLoadingCategories={isLoadingCategories}
                categories={categories}
                tags={tags}
              />

              <ProductShippingInfo />
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <ProductMainImage
                mainImage={mainImage}
                setMainImage={setMainImage}
                setAvailableImages={setAvailableImages}
                setImageFiles={setImageFiles}
                isEditing={isEditing}
                existingImages={existingImages}
                imagesToDelete={imagesToDelete}
              />

              <ProductAdditionalImage
                additionalImages={additionalImages}
                removeImage={removeImage}
                restoreImage={restoreImage}
                handleAdditionalImagesChange={handleAdditionalImagesChange}
                imagesToDelete={imagesToDelete}
                existingImages={existingImages}
              />
            </TabsContent>

            <TabsContent value="variants" className="space-y-6">
              <ProductVariant
                availableImages={availableImages}
                addAttributeToVariant={addAttributeToVariant}
                commonAttributes={commonAttributes}
                updateVariantAttribute={updateVariantAttribute}
                removeAttributeFromVariant={removeAttributeFromVariant}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <ProductSeo />
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitButtonText}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
