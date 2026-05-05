import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | null = null;
let stripeConfig: { publishableKey: string | null; enabled: boolean } | null =
  null;

const FALLBACK_CONFIG = { publishableKey: null, enabled: false } as const;

// Fetch Stripe configuration from the server
async function fetchStripeConfig(): Promise<{
  publishableKey: string | null;
  enabled: boolean;
}> {
  // Skip fetch during build — no server running
  if (
    typeof window === 'undefined' &&
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return FALLBACK_CONFIG;
  }

  if (stripeConfig) {
    return stripeConfig;
  }

  try {
    const response = await fetch('/api/stripe-config');

    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    stripeConfig = await response.json();

    return stripeConfig ?? FALLBACK_CONFIG;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return FALLBACK_CONFIG;
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
