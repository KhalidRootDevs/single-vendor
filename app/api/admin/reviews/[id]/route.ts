import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Review } from '@/models/Review';
import { recalcProductRating } from '@/app/api/products/[id]/reviews/route';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const body = await request.json();
  const { status } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be approved or rejected' },
      { status: 400 }
    );
  }

  const review = await Review.findByIdAndUpdate(
    params.id,
    { status },
    { new: true }
  );

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // Recalculate product rating when a review is approved or rejected
  await recalcProductRating(String(review.productId));

  return NextResponse.json({ message: `Review ${status}`, review });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const review = await Review.findByIdAndDelete(params.id);
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  await recalcProductRating(String(review.productId));

  return NextResponse.json({ message: 'Review deleted' });
}
