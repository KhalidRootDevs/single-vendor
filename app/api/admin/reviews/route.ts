import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Review } from '@/models/Review';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get('limit') ?? 20))
  );
  const status = searchParams.get('status');
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query.status = status;
  }

  const [reviews, total] = await Promise.all([
    Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(query)
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
