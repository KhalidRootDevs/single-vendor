import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeConfigAdmin } from '@/lib/admin-settings';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof (error as { type: unknown }).type === 'string'
  );
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // Validate amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a valid positive number' },
        { status: 400 }
      );
    }

    // Get Stripe configuration from admin settings
    const stripeConfig = await getStripeConfigAdmin();

    if (!stripeConfig.enabled || !stripeConfig.secretKey) {
      return NextResponse.json(
        {
          error: 'Stripe payments are not configured. Please contact support.',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Initialize Stripe with the secret key from admin settings
    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2025-09-30.clover'
    });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100), // Stripe expects amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        source: 'ecommerce_checkout'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: unknown) {
    console.error('Stripe API Error:', error);

    if (isStripeError(error)) {
      if (error.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          {
            error:
              'Stripe authentication failed. Please check your API keys in the admin settings.',
            code: 'STRIPE_AUTH_ERROR'
          },
          { status: 401 }
        );
      }
      if (error.type === 'StripeCardError') {
        return NextResponse.json(
          { error: 'Your card was declined.' },
          { status: 400 }
        );
      }
      if (error.type === 'StripeRateLimitError') {
        return NextResponse.json(
          { error: 'Too many requests made to the API too quickly' },
          { status: 429 }
        );
      }
      if (error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: "Invalid parameters were supplied to Stripe's API" },
          { status: 400 }
        );
      }
      if (error.type === 'StripeAPIError') {
        return NextResponse.json(
          { error: "An error occurred internally with Stripe's API" },
          { status: 500 }
        );
      }
      if (error.type === 'StripeConnectionError') {
        return NextResponse.json(
          {
            error: 'Some kind of error occurred during the HTTPS communication'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing payment',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined
      },
      { status: 500 }
    );
  }
}
