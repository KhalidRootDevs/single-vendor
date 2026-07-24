import connectDB from '@/lib/database';
import { Settings } from '@/models/Settings';

// Get Stripe configuration — prefers environment variables over DB to keep secrets out of MongoDB.
export async function getStripeConfig() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    const stripeConfig = settings.payment?.paymentMethods?.stripe;
    const creditCardsEnabled =
      settings.payment?.paymentMethods?.creditCards || false;

    return {
      publishableKey:
        process.env.STRIPE_PUBLISHABLE_KEY ||
        stripeConfig?.publishableKey ||
        null,
      secretKey:
        process.env.STRIPE_SECRET_KEY || stripeConfig?.secretKey || null,
      enabled: creditCardsEnabled
    };
  } catch (error) {
    console.error('Failed to get Stripe configuration:', error);
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      secretKey: process.env.STRIPE_SECRET_KEY || null,
      enabled: false
    };
  }
}

// Alias kept for any existing imports — delegates to getStripeConfig.
export const getStripeConfigAdmin = getStripeConfig;

// Get PayPal configuration from database settings
export async function getPaypalConfig() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    const paypalConfig = settings.payment?.paymentMethods?.paypal;

    return {
      clientId: process.env.PAYPAL_CLIENT_ID || paypalConfig?.clientId || null,
      secret: process.env.PAYPAL_SECRET || paypalConfig?.secret || null,
      enabled: paypalConfig?.enabled || false
    };
  } catch (error) {
    console.error('Failed to get PayPal configuration:', error);
    return {
      clientId: process.env.PAYPAL_CLIENT_ID || null,
      secret: process.env.PAYPAL_SECRET || null,
      enabled: false
    };
  }
}

// Get tax rate and shipping method costs from Settings.
// Falls back to sensible defaults if settings are not configured yet.
export async function getTaxAndShipping(): Promise<{
  taxRate: number;
  shippingMethods: Record<string, number>;
}> {
  try {
    await connectDB();
    const settings = await Settings.getSettings();

    const taxRate = settings.payment?.tax?.enabled
      ? (settings.payment.tax.taxRate ?? 0) / 100
      : 0;

    const sm = settings.shipping?.methods;
    const shippingMethods: Record<string, number> = {
      standard: sm?.flatRate?.enabled ? sm.flatRate.cost ?? 5.99 : 5.99,
      express: sm?.expressShipping?.enabled
        ? sm.expressShipping.cost ?? 12.99
        : 12.99,
      overnight: 24.99,
      free: 0
    };

    // Apply free shipping override when subtotal threshold is met (handled in order route)
    if (sm?.freeShipping?.enabled) {
      shippingMethods._freeShippingMinimum = sm.freeShipping.minimumAmount ?? 0;
    }

    return { taxRate, shippingMethods };
  } catch (error) {
    console.error('Failed to get tax/shipping settings:', error);
    return {
      taxRate: 0.08,
      shippingMethods: {
        standard: 5.99,
        express: 12.99,
        overnight: 24.99,
        free: 0
      }
    };
  }
}

// Get all payment settings
export async function getPaymentSettings() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    const paymentSettings = settings.payment || {};

    return {
      payment: {
        stripe: {
          publishableKey:
            process.env.STRIPE_PUBLISHABLE_KEY ||
            paymentSettings.paymentMethods?.stripe?.publishableKey ||
            '',
          secretKey:
            process.env.STRIPE_SECRET_KEY ||
            paymentSettings.paymentMethods?.stripe?.secretKey ||
            '',
          enabled: paymentSettings.paymentMethods?.creditCards || false
        },
        paypal: {
          clientId:
            process.env.PAYPAL_CLIENT_ID ||
            paymentSettings.paymentMethods?.paypal?.clientId ||
            '',
          enabled: paymentSettings.paymentMethods?.paypal?.enabled || false
        }
      },
      store: {
        name: settings.general?.storeInfo?.storeName || 'OneVendor',
        currency:
          paymentSettings.currency?.defaultCurrency?.toUpperCase() || 'USD',
        taxRate: paymentSettings.tax?.taxRate || 0,
        shippingRate: 9.99,
        freeShippingThreshold: 50
      }
    };
  } catch (error) {
    console.error('Failed to get payment settings:', error);
    return {
      payment: {
        stripe: { publishableKey: '', secretKey: '', enabled: false },
        paypal: { clientId: '', enabled: false }
      },
      store: {
        name: 'OneVendor',
        currency: 'USD',
        taxRate: 0,
        shippingRate: 9.99,
        freeShippingThreshold: 50
      }
    };
  }
}
