import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | null = null;
let stripeConfig: { publishableKey: string | null; enabled: boolean } | null =
  null;

// Fetch Stripe configuration from the server
async function fetchStripeConfig() {
  if (stripeConfig) {
    return stripeConfig;
  }

  try {
    const response = await fetch('/api/stripe-config');

    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    stripeConfig = await response.json();

    return stripeConfig;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return { publishableKey: null, enabled: false };
  }
}

export const getStripe = async () => {
  const config = await fetchStripeConfig();

  if (!config.enabled || !config.publishableKey) {
    console.warn('Stripe is not properly configured');
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(config.publishableKey);
  }
  return stripePromise;
};

// Utility function to check if Stripe is properly configured
export const isStripeConfigured = async () => {
  const config = await fetchStripeConfig();
  return config.enabled && !!config.publishableKey;
};
