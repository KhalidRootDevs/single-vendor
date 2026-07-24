import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

function getUserId(request: NextRequest): string | null {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token).userId;
  } catch {
    return null;
  }
}

// GET /api/user/wishlist — returns the authenticated user's wishlist product IDs
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId).select('wishlist').lean();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ wishlist: user.wishlist });
}

// POST /api/user/wishlist — add a product to the wishlist
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { productId } = await request.json();
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $addToSet: { wishlist: new mongoose.Types.ObjectId(productId) }
  });

  return NextResponse.json({ message: 'Added to wishlist' });
}

// DELETE /api/user/wishlist — remove a product from the wishlist
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { productId } = await request.json();
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $pull: { wishlist: new mongoose.Types.ObjectId(productId) }
  });

  return NextResponse.json({ message: 'Removed from wishlist' });
}
