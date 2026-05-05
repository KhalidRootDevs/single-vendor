import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userObjectId = new mongoose.Types.ObjectId(decoded.userId);

    const [orderAgg, userDoc] = await Promise.all([
      Order.aggregate([
        { $match: { 'customer.id': userObjectId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0]
              }
            }
          }
        }
      ]),
      User.findById(decoded.userId).select('addresses').lean()
    ]);

    const agg = orderAgg[0];

    return NextResponse.json({
      totalOrders: agg?.totalOrders ?? 0,
      totalSpent: agg?.totalSpent ?? 0,
      addressCount: userDoc?.addresses?.length ?? 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
