import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'cash_on_delivery'
];

/**
 * GET /api/admin/payments
 *
 * Lists payments — one per order, since an order carries its own payment state.
 * Supports search, status/method filters and pagination, and returns totals for
 * the *filtered* set (not just the current page) so the summary cards are honest.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      500
    );
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all';
    const method = searchParams.get('method') || 'all';

    const query: Record<string, unknown> = {};

    if (status !== 'all' && PAYMENT_STATUSES.includes(status)) {
      query.paymentStatus = status;
    }

    if (method !== 'all' && PAYMENT_METHODS.includes(method)) {
      query.paymentMethod = method;
    }

    if (search) {
      // Escaped so a stray "(" in the box can't throw an invalid-regex 500.
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      query.$or = [
        { orderNumber: rx },
        { 'customer.name': rx },
        { 'customer.email': rx },
        { paymentIntentId: rx }
      ];
    }

    const [orders, total, totals] = await Promise.all([
      Order.find(query)
        .select(
          'orderNumber customer total paymentMethod paymentStatus paymentIntentId refundedAmount refundedAt cardDetails status createdAt'
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
      Order.aggregate<{
        _id: null;
        collected: number;
        refunded: number;
      }>([
        { $match: query },
        {
          $group: {
            _id: null,
            collected: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0]
              }
            },
            refunded: { $sum: { $ifNull: ['$refundedAmount', 0] } }
          }
        }
      ])
    ]);

    const collected = totals[0]?.collected ?? 0;
    const refunded = totals[0]?.refunded ?? 0;

    return NextResponse.json({
      payments: orders.map((order) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        transactionId: order.paymentIntentId ?? null,
        customer: {
          name: order.customer?.name ?? 'Guest',
          email: order.customer?.email ?? ''
        },
        date: order.createdAt,
        amount: order.total,
        refundedAmount: order.refundedAmount ?? null,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        cardDetails: order.cardDetails
          ? {
              brand: order.cardDetails.brand ?? order.cardDetails.type,
              last4: order.cardDetails.last4
            }
          : null,
        orderStatus: order.status
      })),
      totals: {
        collected,
        refunded,
        net: collected - refunded
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    console.error('List admin payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
