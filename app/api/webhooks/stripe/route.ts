import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Order } from '@/models/Order';
import connectDB from '@/lib/database';
import { getStripeConfigAdmin } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  const stripeConfig = await getStripeConfigAdmin();
  if (!stripeConfig.secretKey) {
    console.error(
      '[Stripe Webhook] Stripe secret key not configured in admin settings'
    );
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: '2025-09-30.clover'
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error(
      '[Stripe Webhook] Signature verification failed:',
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await Order.findOneAndUpdate(
          { paymentIntentId: intent.id },
          {
            paymentStatus: 'paid',
            status: 'processing',
            $push: {
              timeline: {
                status: 'payment_confirmed',
                date: new Date(),
                description: 'Payment confirmed by Stripe'
              }
            }
          }
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const failureMessage =
          intent.last_payment_error?.message || 'Payment failed';
        await Order.findOneAndUpdate(
          { paymentIntentId: intent.id },
          {
            paymentStatus: 'failed',
            $push: {
              timeline: {
                status: 'payment_confirmed',
                date: new Date(),
                description: `Payment failed: ${failureMessage}`
              }
            }
          }
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await Order.findOneAndUpdate(
            { paymentIntentId: charge.payment_intent },
            {
              paymentStatus: 'refunded',
              status: 'refunded',
              $push: {
                timeline: {
                  status: 'refunded',
                  date: new Date(),
                  description: 'Payment refunded via Stripe'
                }
              }
            }
          );
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
