import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Return } from '@/models/Return';
import { Order } from '@/models/Order';
import { restoreStock } from '@/lib/inventory';

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

  const returnRequest = await Return.findById(params.id);

  if (!returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  returnRequest.status = status;
  if (adminNotes !== undefined) returnRequest.adminNotes = adminNotes;
  if (status === 'approved' && refundAmount !== undefined) {
    returnRequest.refundAmount = Number(refundAmount);
  }

  // Restock the returned items once the return is approved (goods accepted back).
  if (status === 'approved' && !returnRequest.stockRestored) {
    await restoreStock(
      returnRequest.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantAttributes: item.variantAttributes ?? null
      }))
    );
    returnRequest.stockRestored = true;
  }

  await returnRequest.save();

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

  const paymentIntentId = order.paymentIntentId;

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
