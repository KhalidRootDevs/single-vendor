import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Product';
import connectDB from '@/lib/database';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4');

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // First, get the current product to find its category
    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find related products (same category, excluding current product)
    const relatedProducts = await Product.find({
      categoryId: currentProduct.categoryId,
      _id: { $ne: currentProduct._id },
      active: true
    })
      .populate('categoryId', 'name slug')
      .sort({ rating: -1, salesCount: -1 })
      .limit(limit)
      .select(
        'name price compareAtPrice images categoryId rating reviewCount salesCount'
      );

    return NextResponse.json({ products: relatedProducts });
  } catch (error) {
    console.error('Get related products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
