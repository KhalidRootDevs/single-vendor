import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeConfigAdmin } from '@/lib/admin-settings';

export async function POST(request: NextRequest) {
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
      apiVersion: '2024-06-20'
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
  } catch (error: any) {
    console.error('Stripe API Error:', error);

    // Handle specific Stripe errors
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
        { error: 'Some kind of error occurred during the HTTPS communication' },
        { status: 500 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing payment',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
