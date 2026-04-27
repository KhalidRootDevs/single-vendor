import { ProductCard } from '@/components/product-card';
import { Product, ProductCardData } from '@/types';

interface Category {
  id: string;
  name: string;
}

interface ProductGridProps {
  products: Product[];
  categories: Category[];
}

function toCardData(product: Product): ProductCardData {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    category: product.categoryId?.name || '',
    brand: product.brand,
    rating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    featured: product.featured,
    active: product.active,
    createdAt: product.createdAt,
    description: product.description,
    stock: product.stock ?? 0,
    variants: product.variants
  };
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product._id} className="group">
          <ProductCard product={toCardData(product)} />
        </div>
      ))}
    </div>
  );
}
