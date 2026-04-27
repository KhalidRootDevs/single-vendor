import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().optional(),
  attributes: z.record(z.string(), z.string()),
  price: z.coerce.number().min(0, 'Price must be positive').optional(),
  stock: z.coerce
    .number()
    .min(0, 'Stock must be non-negative')
    .default(0)
    .optional(),
  // Accepts blob preview URLs (selected from gallery) or empty — resolved to CDN URLs on server
  image: z.string().optional()
});

const seoSchema = z.object({
  title: z.string().max(60, 'SEO title cannot exceed 60 characters').optional(),
  description: z
    .string()
    .max(160, 'SEO description cannot exceed 160 characters')
    .optional(),
  keywords: z
    .string()
    .max(255, 'SEO keywords cannot exceed 255 characters')
    .optional()
});

export const productSchema = z.object({
  // Basic
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name cannot exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),

  // Pricing & Inventory
  price: z.coerce.number().min(0, 'Price must be positive'),
  compareAtPrice: z.coerce
    .number()
    .min(0, 'Compare at price must be positive')
    .optional(),
  cost: z.coerce.number().min(0, 'Cost must be positive').optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.coerce.number().min(0, 'Stock must be non-negative').default(0),

  // Shipping
  weight: z.coerce.number().min(0, 'Weight must be positive').optional(),
  length: z.coerce.number().min(0, 'Length must be positive').optional(),
  width: z.coerce.number().min(0, 'Width must be positive').optional(),
  height: z.coerce.number().min(0, 'Height must be positive').optional(),

  // Status
  active: z.boolean().default(true),
  featured: z.boolean().default(false),

  // Variants
  variants: z.array(variantSchema).default([]),

  // SEO
  seo: seoSchema.default({}),

  // Images — File[] with preview blob URLs assigned client-side
  images: z
    .array(z.instanceof(File))
    .min(1, 'At least one product image is required')
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const basicInfoSchema = productSchema.pick({
  name: true,
  description: true,
  categoryId: true,
  tags: true
});

export const pricingInventorySchema = productSchema.pick({
  price: true,
  compareAtPrice: true,
  cost: true,
  sku: true,
  barcode: true,
  stock: true
});

export const shippingSchema = productSchema.pick({
  weight: true,
  length: true,
  width: true,
  height: true
});

export const statusSchema = productSchema.pick({
  active: true,
  featured: true
});

export const variantsSchema = productSchema.pick({ variants: true });
export const seoSchema_only = productSchema.pick({ seo: true });
export const imagesSchema = productSchema.pick({ images: true });
