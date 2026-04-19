import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

/**
 * GET /api/user/orders
 * Get all orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const query: any = { 'customer.id': userId };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { createdAt: -1 };

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('orderNumber createdAt status total items trackingNumber')
      .lean();

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
