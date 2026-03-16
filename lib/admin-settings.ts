import connectDB from '@/lib/database';
import { Settings } from '@/models/Settings';

// Get Stripe configuration from database settings
export async function getStripeConfig() {
  try {
    await connectDB();

    // Get settings from database
    const settings = await Settings.getSettings();

    // Extract Stripe configuration
    const stripeConfig = settings.payment?.paymentMethods?.stripe;
    const creditCardsEnabled =
      settings.payment?.paymentMethods?.creditCards || false;

    return {
      publishableKey: stripeConfig?.publishableKey || null,
      secretKey: stripeConfig?.secretKey || null,
      enabled: creditCardsEnabled
    };
  } catch (error) {
    console.error('Failed to get Stripe configuration:', error);
    return {
      publishableKey: null,
      secretKey: null,
      enabled: false
    };
  }
}

export async function getStripeConfigAdmin() {
  try {
    await connectDB();

    // Get settings from database
    const settings = await Settings.getSettings();

    // Extract Stripe configuration
    const stripeConfig = settings.payment?.paymentMethods?.stripe;
    const creditCardsEnabled =
      settings.payment?.paymentMethods?.creditCards || false;

    console.log('Stripe Secret', stripeConfig);

    return {
      publishableKey: stripeConfig?.publishableKey || null,
      secretKey: stripeConfig?.secretKey || null,
      enabled: creditCardsEnabled
    };
  } catch (error) {
    console.error('Failed to get Stripe configuration:', error);
    return {
      publishableKey: null,
      secretKey: null,
      enabled: false
    };
  }
}

// Get PayPal configuration from database settings
export async function getPaypalConfig() {
  try {
    await connectDB();

    // Get settings from database
    const settings = await Settings.getSettings();

    // Extract PayPal configuration
    const paypalConfig = settings.payment?.paymentMethods?.paypal;

    return {
      clientId: paypalConfig?.clientId || null,
      secret: paypalConfig?.secret || null,
      enabled: paypalConfig?.enabled || false
    };
  } catch (error) {
    console.error('Failed to get PayPal configuration:', error);
    return {
      clientId: null,
      secret: null,
      enabled: false
    };
  }
}

// Get all payment settings
export async function getPaymentSettings() {
  try {
    await connectDB();

    // Get settings from database
    const settings = await Settings.getSettings();

    const paymentSettings = settings.payment || {};

    return {
      payment: {
        stripe: {
          publishableKey:
            paymentSettings.paymentMethods?.stripe?.publishableKey || '',
          secretKey: paymentSettings.paymentMethods?.stripe?.secretKey || '',
          enabled: paymentSettings.paymentMethods?.creditCards || false
        },
        paypal: {
          clientId: paymentSettings.paymentMethods?.paypal?.clientId || '',
          enabled: paymentSettings.paymentMethods?.paypal?.enabled || false
        }
      },
      store: {
        name: settings.general?.storeInfo?.storeName || 'OneVendor',
        currency:
          paymentSettings.currency?.defaultCurrency?.toUpperCase() || 'USD',
        taxRate: paymentSettings.tax?.taxRate || 0,
        shippingRate: 9.99, // You might want to add this to your settings schema
        freeShippingThreshold: 50 // You might want to add this to your settings schema
      }
    };
  } catch (error) {
    console.error('Failed to get payment settings:', error);
    return {
      payment: {
        stripe: {
          publishableKey: '',
          secretKey: '',
          enabled: false
        },
        paypal: {
          clientId: '',
          enabled: false
        }
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
