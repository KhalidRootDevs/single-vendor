import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Coupon } from '@/models/Coupon';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const code =
      typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0;

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({ code, active: true });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid or inactive promo code' },
        { status: 404 }
      );
    }

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 422 }
      );
    }

    // Check max uses
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This promo code has reached its usage limit' },
        { status: 422 }
      );
    }

    // Check minimum subtotal
    if (coupon.minSubtotal > 0 && subtotal < coupon.minSubtotal) {
      return NextResponse.json(
        {
          error: `Minimum order of $${coupon.minSubtotal.toFixed(
            2
          )} required for this code`
        },
        { status: 422 }
      );
    }

    // Check per-user limit if authenticated
    if (coupon.perUserLimit > 0) {
      const token = request.cookies.get('token')?.value;
      if (token) {
        try {
          const decoded = verifyToken(token);
          const userUsageCount = await Order.countDocuments({
            'customer.id': decoded.userId,
            couponCode: code
          });
          if (userUsageCount >= coupon.perUserLimit) {
            return NextResponse.json(
              {
                error:
                  'You have already used this promo code the maximum number of times'
              },
              { status: 422 }
            );
          }
        } catch {
          // Not authenticated — skip per-user check
        }
      }
    }

    const discountAmount =
      coupon.type === 'percent'
        ? Math.round(((subtotal * coupon.value) / 100) * 100) / 100
        : Math.min(coupon.value, subtotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
