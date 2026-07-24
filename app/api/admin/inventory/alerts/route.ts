import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Product } from '@/models/Product';

export const dynamic = 'force-dynamic';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const threshold = Number(
    searchParams.get('threshold') ?? DEFAULT_LOW_STOCK_THRESHOLD
  );

  const lowStockProducts = await Product.find({
    active: true,
    stock: { $lte: threshold, $gte: 0 }
  })
    .select('name stock sku images')
    .sort({ stock: 1 })
    .limit(100)
    .lean();

  return NextResponse.json({
    count: lowStockProducts.length,
    threshold,
    products: lowStockProducts
  });
}
