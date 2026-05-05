import { NextResponse } from 'next/server';
import { getStripeConfig } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stripeConfig = await getStripeConfig();

    // Only return the publishable key and enabled status to the client
    return NextResponse.json({
      publishableKey: stripeConfig.publishableKey,
      enabled: stripeConfig.enabled
    });
  } catch (error) {
    console.error('Failed to get Stripe configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}
