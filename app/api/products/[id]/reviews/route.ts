import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get('limit') ?? 10))
  );
  const skip = (page - 1) * limit;

  const productId = params.id;

  const [reviews, total] = await Promise.all([
    Review.find({ productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId, status: 'approved' })
  ]);

  return NextResponse.json({
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  const productId = params.id;

  const body = await request.json();
  const { rating, title, body: reviewBody } = body;

  if (!rating || !title || !reviewBody) {
    return NextResponse.json(
      { error: 'rating, title, and body are required' },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    );
  }

  // Fetch user name for the review snapshot
  const user = await (
    await import('@/models/User')
  ).User.findById(decoded.userId)
    .select('name')
    .lean();
  const userName = (user as { name?: string } | null)?.name || 'Anonymous';

  // Check if user already reviewed this product
  const existing = await Review.findOne({ productId, userId: decoded.userId });
  if (existing) {
    return NextResponse.json(
      { error: 'You have already reviewed this product' },
      { status: 409 }
    );
  }

  // Check if user ordered this product (verified badge)
  const orderedProduct = await Order.findOne({
    'customer.id': new mongoose.Types.ObjectId(decoded.userId),
    'items.productId': new mongoose.Types.ObjectId(productId),
    status: { $in: ['delivered', 'shipped'] }
  });

  const review = await Review.create({
    productId,
    userId: decoded.userId,
    userName,
    rating: Number(rating),
    title: String(title).trim(),
    body: String(reviewBody).trim(),
    verified: !!orderedProduct,
    status: 'pending'
  });

  return NextResponse.json(
    { message: 'Review submitted and pending approval', review },
    { status: 201 }
  );
}

async function recalcProductRating(productId: string) {
  const result = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } }
    }
  ]);

  const avgRating = result[0]?.avgRating ?? 0;
  const reviewCount = result[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount
  });
}

export { recalcProductRating };
