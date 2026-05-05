import { NextRequest, NextResponse } from 'next/server';
import { Settings } from '@/models/Settings';
import connectDB from '@/lib/database';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get or create settings
    const settings = await Settings.getSettings();

    // Remove sensitive data before sending
    const safeSettings = JSON.parse(JSON.stringify(settings));

    // Hide Stripe sensitive data
    if (safeSettings.payment?.paymentMethods?.stripe) {
      safeSettings.payment.paymentMethods.stripe.publishableKey = '[HIDDEN]';
      safeSettings.payment.paymentMethods.stripe.secretKey = '[HIDDEN]';
    }

    // Hide PayPal sensitive data
    if (safeSettings.payment?.paymentMethods?.paypal) {
      safeSettings.payment.paymentMethods.paypal.clientId = '[HIDDEN]';
      safeSettings.payment.paymentMethods.paypal.secret = '[HIDDEN]';
    }

    // Hide SMTP sensitive data
    if (safeSettings.email?.provider?.smtp) {
      safeSettings.email.provider.smtp.username = '[HIDDEN]';
      safeSettings.email.provider.smtp.password = '[HIDDEN]';
    }

    // Hide API sensitive data
    if (safeSettings.advanced?.api) {
      safeSettings.advanced.api.apiKey = '[HIDDEN]';
    }

    // Hide Cloudinary sensitive data
    if (safeSettings.advanced?.cloudinary) {
      safeSettings.advanced.cloudinary.apiKey = '[HIDDEN]';
      safeSettings.advanced.cloudinary.apiSecret = '[HIDDEN]';
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

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { settings: updatedSettings } = body;

    if (!updatedSettings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Get existing settings to preserve sensitive fields
    const existingSettings = await Settings.getSettings();
    const existingSettingsObj = existingSettings.toObject();

    // Merge settings, preserving sensitive fields that shouldn't be updated if empty
    const mergedSettings = deepMergeSettings(
      existingSettingsObj,
      updatedSettings
    );

    // Update settings
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: mergedSettings },
      { new: true, upsert: true, runValidators: true }
    );

    // Remove sensitive data from response
    const safeSettings = JSON.parse(JSON.stringify(settings));

    // Handle payment sensitive fields in response
    if (safeSettings.payment?.paymentMethods?.stripe) {
      safeSettings.payment.paymentMethods.stripe.publishableKey =
        updatedSettings.payment?.paymentMethods?.stripe?.publishableKey
          ? '[UPDATED]'
          : '[HIDDEN]';
      safeSettings.payment.paymentMethods.stripe.secretKey = updatedSettings
        .payment?.paymentMethods?.stripe?.secretKey
        ? '[UPDATED]'
        : '[HIDDEN]';
    }

    if (safeSettings.payment?.paymentMethods?.paypal) {
      safeSettings.payment.paymentMethods.paypal.clientId = updatedSettings
        .payment?.paymentMethods?.paypal?.clientId
        ? '[UPDATED]'
        : '[HIDDEN]';
      safeSettings.payment.paymentMethods.paypal.secret = updatedSettings
        .payment?.paymentMethods?.paypal?.secret
        ? '[UPDATED]'
        : '[HIDDEN]';
    }

    // Handle email sensitive fields in response
    if (safeSettings.email?.provider?.smtp) {
      safeSettings.email.provider.smtp.username = updatedSettings.email
        ?.provider?.smtp?.username
        ? '[UPDATED]'
        : '[HIDDEN]';
      safeSettings.email.provider.smtp.password = updatedSettings.email
        ?.provider?.smtp?.password
        ? '[UPDATED]'
        : '[HIDDEN]';
    }

    // Handle API sensitive fields in response
    if (safeSettings.advanced?.api) {
      safeSettings.advanced.api.apiKey = updatedSettings.advanced?.api?.apiKey
        ? '[UPDATED]'
        : '[HIDDEN]';
    }

    // Handle Cloudinary sensitive fields in response
    if (safeSettings.advanced?.cloudinary) {
      safeSettings.advanced.cloudinary.apiKey = updatedSettings.advanced
        ?.cloudinary?.apiKey
        ? '[UPDATED]'
        : '[HIDDEN]';
      safeSettings.advanced.cloudinary.apiSecret = updatedSettings.advanced
        ?.cloudinary?.apiSecret
        ? '[UPDATED]'
        : '[HIDDEN]';
    }

    return NextResponse.json({
      settings: safeSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enhanced deepMergeSettings function to handle sensitive fields properly
function deepMergeSettings(existing: any, updated: any): any {
  const result = JSON.parse(JSON.stringify(existing));

  // Helper function to merge objects recursively
  function mergeDeep(target: any, source: any) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        // Handle sensitive fields - only update if new value is provided
        if (isSensitiveField(key, target, source)) {
          if (source[key] && source[key] !== '') {
            target[key] = source[key];
          }
          // If source value is empty, preserve existing value
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  mergeDeep(result, updated);
  return result;
}

// Function to identify sensitive fields that shouldn't be overwritten with empty values
function isSensitiveField(key: string, target: any, source: any): boolean {
  const sensitiveFields = [
    'publishableKey',
    'secretKey',
    'secret',
    'clientId',
    'password',
    'apiSecret'
  ];

  // Check if this is a sensitive field in common structures
  if (sensitiveFields.includes(key)) {
    return true;
  }

  // Additional context-aware checks
  const path = getObjectPath(target, source);

  // Cloudinary sensitive fields
  if (
    path.includes('cloudinary') &&
    (key === 'apiKey' || key === 'apiSecret')
  ) {
    return true;
  }

  // Stripe sensitive fields
  if (
    path.includes('stripe') &&
    (key === 'publishableKey' || key === 'secretKey')
  ) {
    return true;
  }

  // PayPal sensitive fields
  if (path.includes('paypal') && (key === 'clientId' || key === 'secret')) {
    return true;
  }

  // SMTP sensitive fields
  if (path.includes('smtp') && (key === 'username' || key === 'password')) {
    return true;
  }

  // API sensitive fields
  if (path.includes('api') && key === 'apiKey') {
    return true;
  }

  return false;
}

// Helper function to get object path for context-aware sensitive field detection
function getObjectPath(target: any, source: any): string {
  // Check Cloudinary path
  if (target?.advanced?.cloudinary && source?.advanced?.cloudinary) {
    return 'advanced.cloudinary';
  }

  // Check Stripe path
  if (
    target?.payment?.paymentMethods?.stripe &&
    source?.payment?.paymentMethods?.stripe
  ) {
    return 'payment.paymentMethods.stripe';
  }

  // Check PayPal path
  if (
    target?.payment?.paymentMethods?.paypal &&
    source?.payment?.paymentMethods?.paypal
  ) {
    return 'payment.paymentMethods.paypal';
  }

  // Check SMTP path
  if (target?.email?.provider?.smtp && source?.email?.provider?.smtp) {
    return 'email.provider.smtp';
  }

  // Check API path
  if (target?.advanced?.api && source?.advanced?.api) {
    return 'advanced.api';
  }

  return '';
}
