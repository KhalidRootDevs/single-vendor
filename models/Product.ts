import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVariant {
  sku?: string;
  attributes: Record<string, string>; // dynamic key-value attributes
  price?: number;
  stock?: number;
  image?: string;
}

export interface ISeo {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  categoryId: mongoose.Types.ObjectId;
  tags: string[];
  stock: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  brand?: string;
  active: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  variants: IVariant[];
  seo: ISeo;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    sku: {
      type: String,
      trim: true
    },
    attributes: {
      type: Schema.Types.Mixed, // stores JSON object like { color: "Red", size: "M" }
      required: [true, 'Variant attributes are required']
    },
    price: {
      type: Number,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    image: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const seoSchema = new Schema<ISeo>({
  title: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  keywords: {
    type: String,
    trim: true,
    maxlength: [255, 'SEO keywords cannot exceed 255 characters']
  }
});

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be a positive number']
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    cost: {
      type: Number,
      min: 0
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock must be a non-negative integer'],
      default: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    length: {
      type: Number,
      min: 0
    },
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    brand: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    salesCount: {
      type: Number,
      default: 0
    },
    variants: [variantSchema],
    seo: seoSchema,
    images: [
      {
        type: String,
        required: [true, 'At least one product image is required']
      }
    ]
  },
  {
    timestamps: true
  }
);

// Auto-generate SKU if missing
productSchema.pre<IProduct>('save', function (next) {
  if (!this.sku) {
    this.sku = `SKU-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;
  }

  this.variants.forEach((variant) => {
    if (!variant.sku) {
      variant.sku = `${this.sku}-${Math.random().toString(36).substring(2, 5)}`;
    }
  });

  next();
});

productSchema.index({ categoryId: 1, active: 1 });

// Compound indexes that cover the most common query + sort patterns.
// Each leads with `active` because every public query filters on it.
productSchema.index({ active: 1, featured: -1, createdAt: -1 }); // default "featured" sort
productSchema.index({ active: 1, createdAt: -1 }); // newest sort
productSchema.index({ active: 1, salesCount: -1 }); // best-selling sort
productSchema.index({ active: 1, rating: -1 }); // rating sort
productSchema.index({ active: 1, price: 1 }); // price-asc sort + range filter
productSchema.index({ active: 1, price: -1 }); // price-desc sort

// Full-text search across name, tags (high weight) and description (low weight).
// NOTE: MongoDB allows only one text index per collection.
// If upgrading from the old { name: 'text', description: 'text' } index, drop it first:
//   db.products.dropIndex('name_text_description_text')
productSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  {
    weights: { name: 10, tags: 5, description: 1 },
    name: 'product_text_search'
  }
);

// Virtual slug
productSchema.virtual('slug').get(function () {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
});

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
