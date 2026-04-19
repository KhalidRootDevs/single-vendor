'use client';

import type React from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout`
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent);
        toast({
          title: 'Payment successful',
          description: 'Your payment has been processed successfully'
        });
      } else if (result.paymentIntent?.status === 'requires_action') {
        toast({
          title: 'Authentication required',
          description: 'Please complete the additional authentication step'
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      onError(message);
      toast({
        title: 'Payment failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement options={{ layout: 'tabs' }} />

          <Button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              'Complete Payment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
