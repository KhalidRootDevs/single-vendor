import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userObjectId = new mongoose.Types.ObjectId(decoded.userId);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10))
    );
    const paymentStatus = searchParams.get('paymentStatus');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const baseMatch: mongoose.FilterQuery<typeof Order> = {
      'customer.id': userObjectId
    };

    if (paymentStatus && paymentStatus !== 'all') {
      baseMatch.paymentStatus = paymentStatus;
    }

    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
      }
      baseMatch.createdAt = range as unknown as Date;
    }

    const skip = (page - 1) * limit;

    const [payments, total, statsAgg] = await Promise.all([
      Order.find(baseMatch)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'orderNumber createdAt total subtotal tax shipping discount paymentMethod paymentStatus cardDetails status'
        )
        .lean(),

      Order.countDocuments(baseMatch),

      Order.aggregate([
        { $match: { 'customer.id': userObjectId } },
        {
          $group: {
            _id: null,
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0]
              }
            },
            totalTransactions: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
            },
            refundedCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const raw = statsAgg[0];
    const stats = {
      totalSpent: raw?.totalSpent ?? 0,
      totalTransactions: raw?.totalTransactions ?? 0,
      paidCount: raw?.paidCount ?? 0,
      pendingCount: raw?.pendingCount ?? 0,
      refundedCount: raw?.refundedCount ?? 0,
      failedCount: raw?.failedCount ?? 0
    };

    return NextResponse.json({
      payments: payments.map((p) => ({ ...p, _id: p._id.toString() })),
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
