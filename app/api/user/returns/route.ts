import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Return } from '@/models/Return';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { sendReturnConfirmationEmail } from '@/lib/email';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get('limit') ?? 10))
  );
  const skip = (page - 1) * limit;

  const [returns, total] = await Promise.all([
    Return.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Return.countDocuments({ userId: decoded.userId })
  ]);

  return NextResponse.json({
    returns,
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

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);

  const body = await request.json();
  const { orderId, items, reason, description } = body;

  if (!orderId || !items?.length || !reason || !description) {
    return NextResponse.json(
      { error: 'orderId, items, reason, and description are required' },
      { status: 400 }
    );
  }

  // Validate order belongs to user and is delivered
  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    'customer.id': new mongoose.Types.ObjectId(decoded.userId)
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'delivered') {
    return NextResponse.json(
      { error: 'Returns can only be requested for delivered orders' },
      { status: 422 }
    );
  }

  // Check if a non-rejected return already exists for this order
  const existingReturn = await Return.findOne({
    orderId,
    userId: decoded.userId,
    status: { $in: ['pending', 'approved', 'refunded'] }
  });

  if (existingReturn) {
    return NextResponse.json(
      { error: 'A return request already exists for this order' },
      { status: 409 }
    );
  }

  const refundAmount = items.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity,
    0
  );

  const returnRequest = await Return.create({
    orderId,
    orderNumber: order.orderNumber,
    userId: decoded.userId,
    userEmail: order.customer.email,
    items,
    reason,
    description: String(description).trim(),
    status: 'pending',
    refundAmount
  });

  sendReturnConfirmationEmail(
    order.customer.email,
    order.customer.name,
    returnRequest.returnNumber,
    order.orderNumber
  ).catch(() => {});

  return NextResponse.json(
    { message: 'Return request submitted', return: returnRequest },
    { status: 201 }
  );
}
