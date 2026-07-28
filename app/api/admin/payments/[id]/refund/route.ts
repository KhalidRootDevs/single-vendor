import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';
import { restoreStock, orderItemsToRestore } from '@/lib/inventory';
import { getStripeConfigAdmin } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/[id]/refund
 *
 * Refunds a paid order. When the order carries a Stripe PaymentIntent the
 * refund goes through Stripe; otherwise (cash on delivery, bank transfer, or an
 * order taken before Stripe was wired up) it is recorded as a manual refund so
 * the books still reflect reality.
 *
 * Accepts an optional { amount } for partial refunds — omit it to refund in full.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Idempotent: a second click must not double-refund.
    if (order.paymentStatus === 'refunded') {
      return NextResponse.json(
        { error: 'This payment has already been refunded' },
        { status: 409 }
      );
    }

    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        {
          error: `Cannot refund a payment with status "${order.paymentStatus}"`
        },
        { status: 422 }
      );
    }

    // Optional partial amount, bounded by the order total.
    const body = await request.json().catch(() => ({}));
    const requested = body?.amount;
    let amount = order.total;

    if (requested !== undefined && requested !== null) {
      const parsed = Number(requested);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: 'Refund amount must be a positive number' },
          { status: 400 }
        );
      }
      if (parsed > order.total) {
        return NextResponse.json(
          { error: 'Refund amount cannot exceed the order total' },
          { status: 400 }
        );
      }
      amount = parsed;
    }

    let refundId: string | undefined;
    let via = 'manual';

    if (order.paymentIntentId) {
      const stripeConfig = await getStripeConfigAdmin();
      if (!stripeConfig.secretKey) {
        return NextResponse.json(
          { error: 'Stripe is not configured — cannot refund this payment' },
          { status: 503 }
        );
      }

      try {
        // Lazy-load so a missing key never breaks unrelated routes at startup.
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeConfig.secretKey, {
          apiVersion: '2025-09-30.clover'
        });

        const refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(amount * 100)
        });

        refundId = refund.id;
        via = 'stripe';
      } catch (err) {
        console.error('[refund] Stripe refund failed:', err);
        return NextResponse.json(
          {
            error:
              err instanceof Error
                ? `Stripe refund failed: ${err.message}`
                : 'Stripe refund failed'
          },
          { status: 502 }
        );
      }
    }

    order.paymentStatus = 'refunded';
    order.refundedAmount = amount;
    order.refundedAt = new Date();
    if (refundId) order.refundId = refundId;

    order.timeline.push({
      status: 'refunded',
      date: new Date(),
      description:
        via === 'stripe'
          ? `Refunded $${amount.toFixed(2)} via Stripe`
          : `Refunded $${amount.toFixed(2)} (recorded manually)`,
      updatedBy: new mongoose.Types.ObjectId(decoded.userId)
    });

    // Money went back, so the goods come back into stock — same rule the
    // cancellation flow follows, and guarded by the same flag.
    if (!order.stockRestored) {
      await restoreStock(orderItemsToRestore(order.items));
      order.stockRestored = true;
    }

    await order.save();

    logAuditEvent({
      adminId: decoded.userId,
      adminEmail: decoded.email,
      action: 'REFUND_PAYMENT',
      resourceType: 'Order',
      resourceId: id,
      before: { paymentStatus: 'paid' },
      after: { paymentStatus: 'refunded', amount, refundId, via },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    }).catch(() => {});

    return NextResponse.json({
      message:
        via === 'stripe'
          ? 'Refund issued through Stripe'
          : 'Refund recorded — settle the funds with the customer directly',
      refund: {
        amount,
        refundId: refundId ?? null,
        via,
        refundedAt: order.refundedAt
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
