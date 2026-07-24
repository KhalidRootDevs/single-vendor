import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Coupon } from '@/models/Coupon';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get('limit') ?? 20))
  );
  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments()
  ]);

  return NextResponse.json({
    coupons,
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

export async function POST(request: NextRequest) {
  await connectDB();

  const body = await request.json();
  const {
    code,
    type,
    value,
    minSubtotal,
    maxUses,
    perUserLimit,
    active,
    expiresAt
  } = body;

  if (!code || !type || value === undefined) {
    return NextResponse.json(
      { error: 'code, type, and value are required' },
      { status: 400 }
    );
  }

  if (type === 'percent' && (value <= 0 || value > 100)) {
    return NextResponse.json(
      { error: 'Percent discount must be between 1 and 100' },
      { status: 400 }
    );
  }

  try {
    const coupon = await Coupon.create({
      code: String(code).toUpperCase().trim(),
      type,
      value: Number(value),
      minSubtotal: Number(minSubtotal ?? 0),
      maxUses: Number(maxUses ?? 0),
      perUserLimit: Number(perUserLimit ?? 0),
      active: active !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    return NextResponse.json(
      { message: 'Coupon created', coupon },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      );
    }
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
