import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Cart } from '@/models/Cart';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  const cart = await Cart.findOne({ userId: decoded.userId }).lean();

  return NextResponse.json({ items: cart?.items ?? [] });
}

export async function PUT(request: NextRequest) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'items must be an array' },
      { status: 400 }
    );
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: decoded.userId },
    { userId: decoded.userId, items },
    { upsert: true, new: true }
  );

  return NextResponse.json({ cart });
}

export async function DELETE(request: NextRequest) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  await Cart.findOneAndDelete({ userId: decoded.userId });

  return NextResponse.json({ message: 'Cart cleared' });
}
