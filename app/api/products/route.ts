import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import connectDB from '@/lib/database';

// Only fetch the fields the listing UI actually uses — avoids shipping variants,
// seo, barcode, dimensions, cost, etc. across the wire on every page load.
const LISTING_PROJECTION = {
  name: 1,
  price: 1,
  compareAtPrice: 1,
  images: 1,
  brand: 1,
  rating: 1,
  reviewCount: 1,
  salesCount: 1,
  featured: 1,
  active: 1,
  createdAt: 1,
  stock: 1,
  description: 1,
  categoryId: 1
};

// ─── Filter-metadata cache ────────────────────────────────────────────────────
// Categories, brands and price bounds rarely change — cache them in the module
// so warmed serverless instances skip 3 extra DB queries per request.
interface FilterCache {
  categories: { _id: string; name: string; slug: string }[];
  brands: string[];
  priceRange: { min: number; max: number };
  cachedAt: number;
}
let filterMetaCache: FilterCache | null = null;
const FILTER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getFilterMetadata(): Promise<FilterCache> {
  const now = Date.now();
  if (filterMetaCache && now - filterMetaCache.cachedAt < FILTER_CACHE_TTL_MS) {
    return filterMetaCache;
  }

  const [categories, brands, priceStats] = await Promise.all([
    Category.find({ active: true })
      .select('name slug')
      .sort({ name: 1 })
      .lean(),
    Product.distinct('brand', { active: true }),
    Product.aggregate<{ minPrice: number; maxPrice: number }>([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ])
  ]);

  filterMetaCache = {
    categories: categories as unknown as FilterCache['categories'],
    brands: (brands as (string | null)[]).filter(Boolean) as string[],
    priceRange: {
      min: priceStats[0]?.minPrice ?? 0,
      max: priceStats[0]?.maxPrice ?? 1000
    },
    cachedAt: now
  };

  return filterMetaCache;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
    const search = searchParams.get('search')?.trim() || '';
    const categorySlugs =
      searchParams.get('categories')?.split(',').filter(Boolean) ?? [];
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) ?? [];
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000000');
    const sortBy = searchParams.get('sort') || 'featured';
    const featured = searchParams.get('featured');
    const active = searchParams.get('active') || 'true';
    const minRating = parseFloat(searchParams.get('minRating') || '0');

    // ── Build query ──────────────────────────────────────────────────────────
    const query: Record<string, unknown> = {};

    if (active !== 'all') {
      query.active = active === 'true';
    }

    // Use the text index instead of regex — orders of magnitude faster on
    // the description field which can be up to 2000 chars.
    if (search) {
      query.$text = { $search: search };
    }

    if (categorySlugs.length > 0) {
      const matchedCategories = await Category.find({
        slug: { $in: categorySlugs }
      })
        .select('_id')
        .lean();

      const categoryIds = matchedCategories.map((c: any) => c._id);
      if (categoryIds.length > 0) {
        query.categoryId = { $in: categoryIds };
      }
    }

    if (brands.length > 0) {
      query.brand = { $in: brands };
    }

    if (minPrice > 0 || maxPrice < 1000000) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (featured != null && featured !== 'all') {
      query.featured = featured === 'true';
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    let sortOptions: Record<string, 1 | -1 | { $meta: string }> = {};
    switch (sortBy) {
      case 'price-asc':
        sortOptions = { price: 1 };
        break;
      case 'price-desc':
        sortOptions = { price: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'best-selling':
        sortOptions = { salesCount: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'relevance':
        if (search) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { featured: -1, createdAt: -1 };
        }
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    // ── Run product query + count + filter metadata in parallel ───────────────
    // Previously these were 5 sequential awaits — now it's one parallel batch.
    const [products, total, filterMeta] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select(LISTING_PROJECTION)
        .lean(), // skip Mongoose document hydration
      Product.countDocuments(query),
      getFilterMetadata() // served from cache after first warm-up
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        categories: filterMeta.categories,
        brands: filterMeta.brands,
        priceRange: filterMeta.priceRange
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
