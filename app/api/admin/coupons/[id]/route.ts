import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Coupon } from '@/models/Coupon';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const updateData: Record<string, unknown> = {};
  if (code !== undefined) updateData.code = String(code).toUpperCase().trim();
  if (type !== undefined) updateData.type = type;
  if (value !== undefined) updateData.value = Number(value);
  if (minSubtotal !== undefined) updateData.minSubtotal = Number(minSubtotal);
  if (maxUses !== undefined) updateData.maxUses = Number(maxUses);
  if (perUserLimit !== undefined)
    updateData.perUserLimit = Number(perUserLimit);
  if (active !== undefined) updateData.active = Boolean(active);
  if (expiresAt !== undefined)
    updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const coupon = await Coupon.findByIdAndUpdate(params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Coupon updated', coupon });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const coupon = await Coupon.findByIdAndDelete(params.id);
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Coupon deleted' });
}
