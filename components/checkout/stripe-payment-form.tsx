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
      // Validate elements first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          // Change this to your success page
          return_url: `${window.location.origin}/payment-success`
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
          <PaymentElement
            options={{
              layout: 'tabs'
            }}
          />

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

// 'use client';

// import type React from 'react';
// import { useState, useEffect } from 'react';
// import {
//   PaymentElement,
//   useStripe,
//   useElements,
//   AddressElement
// } from '@stripe/react-stripe-js';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter
// } from '@/components/ui/card';
// import {
//   Loader2,
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
//   Lock
// } from 'lucide-react';
// import { toast } from '@/components/ui/use-toast';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { cn } from '@/lib/utils';

// interface StripePaymentFormProps {
//   clientSecret: string;
//   onSuccess: (paymentIntent: any) => void;
//   onError: (error: string) => void;
//   isProcessing: boolean;
//   setIsProcessing: (processing: boolean) => void;
//   amount?: number;
//   currency?: string;
//   email?: string;
//   onEmailChange?: (email: string) => void;
//   showEmailField?: boolean;
//   showBillingAddress?: boolean;
//   showShippingAddress?: boolean;
//   returnUrl?: string;
//   buttonText?: string;
//   className?: string;
// }

// export function StripePaymentForm({
//   clientSecret,
//   onSuccess,
//   onError,
//   isProcessing,
//   setIsProcessing,
//   amount,
//   currency = 'USD',
//   email: initialEmail = '',
//   onEmailChange,
//   showEmailField = true,
//   showBillingAddress = false,
//   showShippingAddress = false,
//   returnUrl,
//   buttonText = 'Complete Payment',
//   className
// }: StripePaymentFormProps) {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [email, setEmail] = useState(initialEmail);
//   const [paymentError, setPaymentError] = useState<string | null>(null);
//   const [paymentSuccess, setPaymentSuccess] = useState(false);
//   const [cardComplete, setCardComplete] = useState(false);
//   const [billingAddressComplete, setBillingAddressComplete] = useState(false);
//   const [shippingAddressComplete, setShippingAddressComplete] = useState(false);

//   // Update local email when prop changes
//   useEffect(() => {
//     setEmail(initialEmail);
//   }, [initialEmail]);

//   // Clear error when client secret changes
//   useEffect(() => {
//     setPaymentError(null);
//     setPaymentSuccess(false);
//   }, [clientSecret]);

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newEmail = e.target.value;
//     setEmail(newEmail);
//     onEmailChange?.(newEmail);
//   };

//   const validateEmail = (email: string) => {
//     if (!showEmailField) return true;
//     if (!email) return false;
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     // Validate email if required
//     if (showEmailField && !validateEmail(email)) {
//       setPaymentError('Please enter a valid email address');
//       toast({
//         title: 'Validation Error',
//         description: 'Please enter a valid email address',
//         variant: 'destructive'
//       });
//       return;
//     }

//     setIsProcessing(true);
//     setPaymentError(null);

//     try {
//       // Prepare confirmation parameters
//       const confirmParams: any = {
//         elements,
//         redirect: 'if_required',
//         confirmParams: {
//           receipt_email: email || undefined
//         }
//       };

//       // Add return URL if provided
//       if (returnUrl) {
//         confirmParams.confirmParams.return_url = returnUrl;
//       }

//       const { error, paymentIntent } =
//         await stripe.confirmPayment(confirmParams);

//       if (error) {
//         // Handle specific error types
//         let errorMessage = error.message || 'Payment failed';

//         if (error.type === 'card_error' || error.type === 'validation_error') {
//           errorMessage = error.message || 'Your card was declined';
//         } else if (error.code === 'payment_intent_authentication_failure') {
//           errorMessage = 'Payment authentication failed. Please try again.';
//         } else if (error.code === 'payment_intent_payment_attempt_failed') {
//           errorMessage =
//             'Payment attempt failed. Please check your card details.';
//         }

//         setPaymentError(errorMessage);
//         onError(errorMessage);

//         toast({
//           title: 'Payment failed',
//           description: errorMessage,
//           variant: 'destructive'
//         });
//       } else if (paymentIntent && paymentIntent.status === 'succeeded') {
//         setPaymentSuccess(true);
//         onSuccess(paymentIntent);

//         toast({
//           title: 'Payment successful',
//           description: 'Your payment has been processed successfully',
//           variant: 'default'
//         });

//         // Clear the form
//         elements.getElement('payment')?.clear();
//       } else if (paymentIntent && paymentIntent.status === 'requires_action') {
//         // 3D Secure authentication is in progress
//         toast({
//           title: 'Authentication required',
//           description: 'Please complete the additional authentication step',
//           variant: 'default'
//         });
//       }
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : 'An unexpected error occurred';
//       setPaymentError(errorMessage);
//       onError(errorMessage);

//       toast({
//         title: 'Payment error',
//         description: errorMessage,
//         variant: 'destructive'
//       });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const isFormValid = () => {
//     if (!stripe || !elements) return false;
//     if (showEmailField && !validateEmail(email)) return false;
//     if (!cardComplete) return false;
//     if (showBillingAddress && !billingAddressComplete) return false;
//     if (showShippingAddress && !shippingAddressComplete) return false;
//     return true;
//   };

//   const formatAmount = (amount?: number) => {
//     if (!amount) return '';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency
//     }).format(amount / 100);
//   };

//   return (
//     <Card className={cn('mx-auto w-full max-w-2xl', className)}>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="flex items-center gap-2 text-2xl">
//               <CreditCard className="h-6 w-6" />
//               Complete Payment
//             </CardTitle>
//             <CardDescription className="mt-1">
//               Enter your payment details to complete your purchase
//             </CardDescription>
//           </div>
//           {amount && (
//             <div className="text-right">
//               <p className="text-sm text-muted-foreground">Total Amount</p>
//               <p className="text-2xl font-bold">{formatAmount(amount)}</p>
//             </div>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Security Badge */}
//           <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
//             <Lock className="h-4 w-4" />
//             <span>Your payment information is encrypted and secure</span>
//           </div>

//           {/* Email Field */}
//           {showEmailField && (
//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-sm font-medium">
//                 Email Address <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={handleEmailChange}
//                 disabled={isProcessing || paymentSuccess}
//                 className={cn(
//                   'transition-colors',
//                   email &&
//                     !validateEmail(email) &&
//                     'border-red-500 focus-visible:ring-red-500'
//                 )}
//                 required
//               />
//               {email && !validateEmail(email) && (
//                 <p className="mt-1 text-xs text-red-500">
//                   Please enter a valid email address
//                 </p>
//               )}
//             </div>
//           )}

//           {/* Payment Element */}
//           <div className="space-y-2">
//             <Label className="text-sm font-medium">
//               Payment Method <span className="text-red-500">*</span>
//             </Label>
//             <div
//               className={cn(
//                 'rounded-lg border p-4 transition-colors',
//                 cardComplete
//                   ? 'border-green-500 bg-green-50/50'
//                   : 'border-gray-200'
//               )}
//             >
//               <PaymentElement
//                 options={{
//                   layout: {
//                     type: 'tabs',
//                     defaultCollapsed: false
//                   },
//                   paymentMethodOrder: [
//                     'card',
//                     'apple_pay',
//                     'google_pay',
//                     'link'
//                   ],
//                   fields: {
//                     billingDetails: {
//                       name: showBillingAddress ? 'auto' : 'never',
//                       email: 'never',
//                       phone: 'never',
//                       address: showBillingAddress ? 'auto' : 'never'
//                     }
//                   }
//                 }}
//                 onChange={(event) => {
//                   setCardComplete(event.complete);
//                   setPaymentError(null); // Clear error when user starts typing
//                 }}
//               />
//             </div>
//           </div>

//           {/* Billing Address */}
//           {showBillingAddress && (
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Billing Address</Label>
//               <AddressElement
//                 options={{
//                   mode: 'billing',
//                   allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
//                   fields: {
//                     phone: 'never'
//                   },
//                   validation: {
//                     phone: {
//                       required: 'never'
//                     }
//                   }
//                 }}
//                 onChange={(event) => {
//                   setBillingAddressComplete(event.complete);
//                 }}
//               />
//             </div>
//           )}

//           {/* Shipping Address */}
//           {showShippingAddress && (
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Shipping Address</Label>
//               <AddressElement
//                 options={{
//                   mode: 'shipping',
//                   allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
//                   fields: {
//                     phone: 'always'
//                   },
//                   validation: {
//                     phone: {
//                       required: 'always'
//                     }
//                   }
//                 }}
//                 onChange={(event) => {
//                   setShippingAddressComplete(event.complete);
//                 }}
//               />
//             </div>
//           )}

//           {/* Error Message */}
//           {paymentError && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{paymentError}</AlertDescription>
//             </Alert>
//           )}

//           {/* Success Message */}
//           {paymentSuccess && (
//             <Alert className="border-green-500 bg-green-50">
//               <CheckCircle className="h-4 w-4 text-green-500" />
//               <AlertDescription className="text-green-700">
//                 Payment successful! Thank you for your purchase.
//               </AlertDescription>
//             </Alert>
//           )}

//           <Separator />

//           <Button
//             type="submit"
//             disabled={
//               !stripe || !isFormValid() || isProcessing || paymentSuccess
//             }
//             className="h-12 w-full text-base font-semibold"
//             size="lg"
//           >
//             {isProcessing ? (
//               <>
//                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
//                 Processing Payment...
//               </>
//             ) : paymentSuccess ? (
//               <>
//                 <CheckCircle className="mr-2 h-5 w-5" />
//                 Payment Complete
//               </>
//             ) : (
//               buttonText
//             )}
//           </Button>

//           {/* Payment Methods Icons */}
//           <div className="mt-4 flex items-center justify-center gap-4">
//             <img src="/images/visa.svg" alt="Visa" className="h-6" />
//             <img
//               src="/images/mastercard.svg"
//               alt="Mastercard"
//               className="h-6"
//             />
//             <img
//               src="/images/amex.svg"
//               alt="American Express"
//               className="h-6"
//             />
//             <img src="/images/discover.svg" alt="Discover" className="h-6" />
//           </div>
//         </form>
//       </CardContent>

//       <CardFooter className="flex justify-center text-xs text-muted-foreground">
//         <p>© 2024 Your Store. All rights reserved.</p>
//       </CardFooter>
//     </Card>
//   );
// }
