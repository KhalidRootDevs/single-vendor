import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Return } from '@/models/Return';
import { Order } from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const returnRequest = await Return.findById(params.id).lean();
  if (!returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  return NextResponse.json({ return: returnRequest });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const body = await request.json();
  const { status, adminNotes, refundAmount } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be approved or rejected' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (status === 'approved' && refundAmount !== undefined) {
    updateData.refundAmount = Number(refundAmount);
  }

  const returnRequest = await Return.findByIdAndUpdate(params.id, updateData, {
    new: true
  });

  if (!returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: `Return ${status}`,
    return: returnRequest
  });
}

// POST /api/admin/returns/[id] — process refund
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const returnRequest = await Return.findById(params.id);
  if (!returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  if (returnRequest.status !== 'approved') {
    return NextResponse.json(
      { error: 'Return must be approved before processing refund' },
      { status: 422 }
    );
  }

  // Look up Stripe paymentIntentId from the order
  const order = await Order.findById(returnRequest.orderId).select(
    'paymentIntentId customer'
  );
  if (!order) {
    return NextResponse.json(
      { error: 'Associated order not found' },
      { status: 404 }
    );
  }

  const paymentIntentId = (order as unknown as Record<string, unknown>)
    .paymentIntentId as string | undefined;

  if (paymentIntentId) {
    try {
      // Lazy-load Stripe to avoid startup errors when key is missing
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover'
      });

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(returnRequest.refundAmount * 100)
      });

      returnRequest.refundId = refund.id;
    } catch (err) {
      console.error('Stripe refund error:', err);
      return NextResponse.json(
        { error: 'Stripe refund failed' },
        { status: 502 }
      );
    }
  }

  returnRequest.status = 'refunded';
  await returnRequest.save();

  // Mark order payment status as refunded
  await Order.findByIdAndUpdate(returnRequest.orderId, {
    paymentStatus: 'refunded'
  });

  return NextResponse.json({
    message: 'Refund processed',
    return: returnRequest
  });
}
