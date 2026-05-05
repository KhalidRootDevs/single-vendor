import { NextRequest, NextResponse } from 'next/server';
import { Settings } from '@/models/Settings';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get or create settings
    const settings = await Settings.getSettings();

    // Remove sensitive data before sending
    const safeSettings = JSON.parse(JSON.stringify(settings));

    if (safeSettings.payment?.paymentMethods?.stripe) {
      safeSettings.payment.paymentMethods.stripe.secretKey = '[HIDDEN]';
    }

    if (safeSettings.payment?.paymentMethods?.paypal) {
      safeSettings.payment.paymentMethods.paypal.secret = '[HIDDEN]';
    }

    if (safeSettings.email?.provider?.smtp) {
      safeSettings.email.provider.smtp.password = '[HIDDEN]';
    }

    if (safeSettings.advanced?.api) {
      safeSettings.advanced.api.apiKey = '[HIDDEN]';
    }

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
