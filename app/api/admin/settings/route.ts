import { NextRequest, NextResponse } from 'next/server';
import { Settings } from '@/models/Settings';
import connectDB from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const settings = await Settings.getSettings();
    const safeSettings = JSON.parse(JSON.stringify(settings));

    if (safeSettings.payment?.paymentMethods?.stripe) {
      safeSettings.payment.paymentMethods.stripe.publishableKey = '[HIDDEN]';
      safeSettings.payment.paymentMethods.stripe.secretKey = '[HIDDEN]';
    }
    if (safeSettings.payment?.paymentMethods?.paypal) {
      safeSettings.payment.paymentMethods.paypal.clientId = '[HIDDEN]';
      safeSettings.payment.paymentMethods.paypal.secret = '[HIDDEN]';
    }
    if (safeSettings.email?.provider?.smtp) {
      safeSettings.email.provider.smtp.username = '[HIDDEN]';
      safeSettings.email.provider.smtp.password = '[HIDDEN]';
    }
    if (safeSettings.advanced?.api) {
      safeSettings.advanced.api.apiKey = '[HIDDEN]';
    }
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
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

    const existingSettings = await Settings.getSettings();
    const existingSettingsObj = existingSettings.toObject();
    const mergedSettings = deepMergeSettings(
      existingSettingsObj,
      updatedSettings
    );

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: mergedSettings },
      { new: true, upsert: true, runValidators: true }
    );

    const safeSettings = JSON.parse(JSON.stringify(settings));

    if (safeSettings.payment?.paymentMethods?.stripe) {
      safeSettings.payment.paymentMethods.stripe.publishableKey = '[HIDDEN]';
      safeSettings.payment.paymentMethods.stripe.secretKey = '[HIDDEN]';
    }
    if (safeSettings.payment?.paymentMethods?.paypal) {
      safeSettings.payment.paymentMethods.paypal.clientId = '[HIDDEN]';
      safeSettings.payment.paymentMethods.paypal.secret = '[HIDDEN]';
    }
    if (safeSettings.email?.provider?.smtp) {
      safeSettings.email.provider.smtp.username = '[HIDDEN]';
      safeSettings.email.provider.smtp.password = '[HIDDEN]';
    }
    if (safeSettings.advanced?.api) {
      safeSettings.advanced.api.apiKey = '[HIDDEN]';
    }
    if (safeSettings.advanced?.cloudinary) {
      safeSettings.advanced.cloudinary.apiKey = '[HIDDEN]';
      safeSettings.advanced.cloudinary.apiSecret = '[HIDDEN]';
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

function isSensitiveAt(fullPath: string[]): boolean {
  const key = fullPath[fullPath.length - 1];
  const parentPath = fullPath.slice(0, -1).join('.');

  // Always-sensitive keys regardless of location
  if (['secretKey', 'apiSecret', 'password'].includes(key)) return true;

  // Context-sensitive keys
  if (key === 'publishableKey' && parentPath.includes('stripe')) return true;
  if (key === 'clientId' && parentPath.includes('paypal')) return true;
  if (key === 'secret' && parentPath.includes('paypal')) return true;
  if (key === 'username' && parentPath.includes('smtp')) return true;
  if (
    key === 'apiKey' &&
    (parentPath.includes('cloudinary') || parentPath === 'advanced.api')
  )
    return true;

  return false;
}

function deepMergeSettings(existing: any, updated: any): any {
  const result = JSON.parse(JSON.stringify(existing));

  function mergeDeep(target: any, source: any, path: string[]) {
    for (const key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key], [...path, key]);
      } else {
        const currentPath = [...path, key];
        if (isSensitiveAt(currentPath)) {
          // Only update if new value is non-empty — preserve existing secret otherwise
          if (source[key] && source[key] !== '') {
            target[key] = source[key];
          }
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  mergeDeep(result, updated, []);
  return result;
}
