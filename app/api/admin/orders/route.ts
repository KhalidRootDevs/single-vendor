import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import connectDB from '@/lib/database';
import { escapeRegex } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ALLOWED_ORDER_SORT_FIELDS = [
  'createdAt',
  'total',
  'status',
  'orderNumber',
  'paymentStatus',
  'date'
];

/**
 * GET /api/admin/orders
 * Admin endpoint to fetch all orders with advanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minTotal = searchParams.get('minTotal');
    const maxTotal = searchParams.get('maxTotal');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: Record<string, unknown> = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      query.createdAt = dateFilter;
    }

    // Total amount filter
    if (minTotal || maxTotal) {
      const totalFilter: Record<string, number> = {};
      if (minTotal) totalFilter.$gte = Number.parseFloat(minTotal);
      if (maxTotal) totalFilter.$lte = Number.parseFloat(maxTotal);
      query.total = totalFilter;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { orderNumber: { $regex: safeSearch, $options: 'i' } },
        { 'customer.name': { $regex: safeSearch, $options: 'i' } },
        { 'customer.email': { $regex: safeSearch, $options: 'i' } },
        { 'customer.phone': { $regex: safeSearch, $options: 'i' } },
        { trackingNumber: { $regex: safeSearch, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const safeSortBy = ALLOWED_ORDER_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sort: Record<string, 1 | -1> = {
      [safeSortBy]: sortOrder === 'desc' ? -1 : 1
    };

    // Get orders with proper population
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean(); // Use lean for better performance

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get order statistics
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          }
        }
      }
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: stats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
