'use client';

import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  Plus,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/ui/container';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';
import { Address } from '@/types';
import { CheckoutFormValues, checkoutSchema } from '@/lib/validations/index';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ── Shipping options ──────────────────────────────────────────────────────────
const shippingMethods = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    price: 5.99,
    days: '5–7 business days'
  },
  {
    id: 'express',
    name: 'Express Shipping',
    price: 12.99,
    days: '2–3 business days'
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    price: 24.99,
    days: '1 business day'
  }
];

// ── Tiny layout helpers ───────────────────────────────────────────────────────
function SectionCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white dark:bg-white dark:text-neutral-900">
        {step}
      </span>
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ── Checkout progress bar ─────────────────────────────────────────────────────
const STEPS = ['Cart', 'Details', 'Payment', 'Confirmed'];

function CheckoutProgress({ active }: { active: number }) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-wider',
                    current
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 mb-5 h-px w-12 transition-colors sm:w-20',
                    done
                      ? 'bg-emerald-400'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, subtotal, tax, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // ── State (ALL UNCHANGED) ──────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeError, setStripeError] = useState('');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [, setLoadingAddresses] = useState(false);

  // UI-only: countdown for post-order redirect
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    checkStripeConfiguration();
    if (items.length === 0) {
      router.push('/cart');
    }
    if (user) {
      fetchSavedAddresses();
    }
  }, [items.length, router, user]);

  // Auto-redirect to order detail page after successful order.
  // orderId = orderNumber returned by POST /api/orders (e.g. "ORD-20260506-YBJN67")
  useEffect(() => {
    if (!orderComplete || !orderId) return;

    const redirect = setTimeout(() => {
      router.push(`/account/orders/${orderId}`);
    }, 3000);

    const tick = setInterval(() => {
      setRedirectCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => {
      clearTimeout(redirect);
      clearInterval(tick);
    };
  }, [orderComplete, orderId, router]);

  // ── Business logic (ALL UNCHANGED) ───────────────────────────────────────
  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        setSavedAddresses(data.addresses || []);
        const defaultAddress = data.addresses?.find(
          (addr: Address) => addr.isDefault
        );
        if (defaultAddress && !useNewAddress) {
          setSelectedAddressId(defaultAddress._id);
          populateAddressFields(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const populateAddressFields = (address: Address) => {
    setValue('shippingAddress.fullName', address.fullName);
    setValue('shippingAddress.address', address.address);
    setValue('shippingAddress.city', address.city);
    setValue('shippingAddress.state', address.state);
    setValue('shippingAddress.zipCode', address.zipCode);
    setValue('shippingAddress.country', address.country);
    setValue('shippingAddress.phone', address.phone);
  };

  const handleAddressSelection = (addressId: string) => {
    if (addressId === 'new') {
      setUseNewAddress(true);
      setSelectedAddressId('');
      setValue('shippingAddress.fullName', '');
      setValue('shippingAddress.address', '');
      setValue('shippingAddress.city', '');
      setValue('shippingAddress.state', '');
      setValue('shippingAddress.zipCode', '');
      setValue('shippingAddress.country', '');
      setValue('shippingAddress.phone', '');
    } else {
      setUseNewAddress(false);
      setSelectedAddressId(addressId);
      const selectedAddress = savedAddresses.find(
        (addr) => addr._id === addressId
      );
      if (selectedAddress) {
        populateAddressFields(selectedAddress);
      }
    }
  };

  const checkStripeConfiguration = async () => {
    try {
      setCheckingStripe(true);
      const stripe = await getStripe();
      setStripePromise(Promise.resolve(stripe));
      setStripeConfigured(!!stripe);
      if (!stripe) {
        setStripeError(
          'Credit card payments are currently unavailable. Please use an alternative payment method.'
        );
      }
    } catch (error) {
      console.error('❌ Error checking Stripe configuration:', error);
      setStripeError('Unable to load payment system. Please try again later.');
      setStripeConfigured(false);
    } finally {
      setCheckingStripe(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      contactInfo: { fullName: '', email: '', phone: '' },
      shippingAddress: {
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: ''
      },
      billingAddress: {
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      notes: ''
    }
  });

  const paymentMethod = watch('paymentMethod');
  const shippingMethod = watch('shippingMethod');
  const shippingAddress = watch('shippingAddress');
  const contactInfo = watch('contactInfo');

  useEffect(() => {
    if (sameAsShipping) {
      setValue('billingAddress.fullName', shippingAddress.fullName);
      setValue('billingAddress.address', shippingAddress.address);
      setValue('billingAddress.city', shippingAddress.city);
      setValue('billingAddress.state', shippingAddress.state);
      setValue('billingAddress.zipCode', shippingAddress.zipCode);
      setValue('billingAddress.country', shippingAddress.country);
    }
  }, [sameAsShipping, shippingAddress, setValue]);

  const selectedShippingMethodObj =
    shippingMethods.find((m) => m.id === shippingMethod) ?? shippingMethods[0];
  const selectedShippingCost = selectedShippingMethodObj.price;
  const orderTotal = subtotal + tax + selectedShippingCost;

  const createPaymentIntent = async () => {
    try {
      setCreatingPaymentIntent(true);
      setStripeError('');
      if (!orderTotal || orderTotal <= 0)
        throw new Error('Invalid order total');
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotal,
          currency: 'usd',
          metadata: {
            orderItems: items.length.toString(),
            customerEmail: contactInfo.email || 'guest@example.com',
            customerName: contactInfo.fullName,
            orderTotal: orderTotal.toString()
          }
        })
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to create intent');
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || '');
        return true;
      } else throw new Error('No client secret received from server');
    } catch (error: any) {
      console.error('❌ Error creating payment intent:', error);
      const msg =
        error.message || 'Unable to initialize payment. Please try again.';
      setStripeError(msg);
      toast.error('Payment setup failed');
      return false;
    } finally {
      setCreatingPaymentIntent(false);
    }
  };

  const handlePlaceOrder = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    const currentPaymentMethod = getValues('paymentMethod');
    if (
      currentPaymentMethod === 'credit_card' ||
      currentPaymentMethod === 'debit_card'
    ) {
      if (!stripeConfigured) {
        setStripeError(
          'Payment system unavailable. Please select another payment method.'
        );
        toast.error('Please choose another payment option.');
        return;
      }
      const intentCreated = await createPaymentIntent();
      if (intentCreated) {
        setShowPaymentModal(true);
      }
    } else {
      const formData = getValues();
      await processOrder(formData);
    }
  };

  const onSubmit = async (_data: CheckoutFormValues) => {};

  const processOrder = async (
    data: CheckoutFormValues,
    paymentIntent?: any
  ) => {
    setIsSubmitting(true);
    try {
      const orderItems = items.map((item, index) => ({
        id: index + 1,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.selectedOptions
          ? {
              attributes: item.selectedOptions,
              sku: `${item.productId}-${Object.values(
                item.selectedOptions
              ).join('-')}`
            }
          : undefined,
        productId: item.productId,
        sku: item.variantSku || `${item.productId}-default`
      }));

      const selectedShippingMethod =
        shippingMethods.find((method) => method.id === data.shippingMethod) ??
        shippingMethods[0];

      const billingAddressData = sameAsShipping
        ? {
            fullName: data.shippingAddress.fullName,
            address: data.shippingAddress.address,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            zipCode: data.shippingAddress.zipCode,
            country: data.shippingAddress.country
          }
        : {
            fullName: data.billingAddress.fullName || '',
            address: data.billingAddress.address || '',
            city: data.billingAddress.city || '',
            state: data.billingAddress.state || '',
            zipCode: data.billingAddress.zipCode || '',
            country: data.billingAddress.country || ''
          };

      let paymentStatus: 'pending' | 'paid' | 'failed' = 'pending';
      if (data.paymentMethod === 'cash_on_delivery') {
        paymentStatus = 'pending';
      } else if (
        data.paymentMethod === 'credit_card' ||
        data.paymentMethod === 'debit_card'
      ) {
        paymentStatus =
          paymentIntent && paymentIntent.status === 'succeeded'
            ? 'paid'
            : 'pending';
      } else {
        paymentStatus = 'pending';
      }

      const orderData = {
        customer: {
          id: user?.id || 'guest',
          name: data.contactInfo.fullName,
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          address: data.shippingAddress.address
        },
        shippingAddress: {
          fullName: data.shippingAddress.fullName,
          address: data.shippingAddress.address,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          zipCode: data.shippingAddress.zipCode,
          country: data.shippingAddress.country,
          phone: data.shippingAddress.phone
        },
        billingAddress: billingAddressData,
        items: orderItems,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        paymentIntentId: paymentIntent?.id || paymentIntentId,
        shippingMethod: selectedShippingMethod.id,
        notes: data.notes,
        subtotal,
        tax,
        shipping: selectedShippingMethod.price,
        total: subtotal + tax + selectedShippingMethod.price
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Failed to create order');

      // orderId = orderNumber from backend (e.g. "ORD-20260506-YBJN67")
      // useEffect above will redirect to /account/orders/${orderId}
      setOrderId(result.order.orderNumber);
      clearCart();
      setOrderComplete(true);
      setShowPaymentModal(false);

      toast.success(`Order ${result.order.orderNumber} confirmed!`);
    } catch (error: any) {
      console.error('❌ Error processing order:', error);
      toast.error('Error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSuccess = (paymentIntent: any) => {
    const formData = getValues();
    processOrder(formData, paymentIntent);
  };

  const handleStripeError = (error: string) => {
    setStripeError(error);
    setShowPaymentModal(false);
  };

  const handlePaymentMethodChange = (value: string) => {
    setValue(
      'paymentMethod',
      value as 'credit_card' | 'debit_card' | 'paypal' | 'cash_on_delivery'
    );
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setStripeError('');
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isMounted) return null;

  if (items.length === 0 && isMounted) {
    router.push('/cart');
    return null;
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (orderComplete) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md text-center">
          {/* Animated checkmark */}
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-12 w-12 animate-[scale-in_0.4s_ease-out] text-emerald-500" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Order Confirmed!
          </h1>
          <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
            Thank you for your purchase. Your order is being processed.
          </p>

          {/* Order detail card */}
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 text-left dark:border-neutral-800 dark:bg-neutral-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Order Summary
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Order number</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {orderId}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Date</span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Total</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  ${orderTotal.toFixed(2)}
                </span>
              </div>
              {paymentIntentId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Payment ID</span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {paymentIntentId.slice(0, 20)}…
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Redirect notice */}
          <p className="mb-6 text-xs text-neutral-400">
            Redirecting to your order in{' '}
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">
              {redirectCountdown}s
            </span>
            …
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {/* Primary: go to order now — uses orderId from backend */}
            <Button
              onClick={() => router.push(`/account/orders/${orderId}`)}
              className="gap-2"
            >
              View My Order
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 py-8 dark:bg-neutral-950">
      <Container>
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {items.length} item{items.length !== 1 ? 's' : ''} · $
            {subtotal.toFixed(2)}
          </p>
        </div>

        {/* Progress */}
        <CheckoutProgress active={1} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            {/* ── Left: form sections ─────────────────────────────────── */}
            <div className="space-y-5">
              {/* 1 · Contact Information */}
              <SectionCard>
                <SectionTitle step={1} title="Contact Information" />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      className={cn(
                        errors.contactInfo?.fullName &&
                          'border-red-400 focus-visible:ring-red-400'
                      )}
                      {...register('contactInfo.fullName')}
                    />
                    <FieldError
                      message={errors.contactInfo?.fullName?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className={cn(
                          errors.contactInfo?.email &&
                            'border-red-400 focus-visible:ring-red-400'
                        )}
                        {...register('contactInfo.email')}
                      />
                      <FieldError
                        message={errors.contactInfo?.email?.message}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 000-0000"
                        className={cn(
                          errors.contactInfo?.phone &&
                            'border-red-400 focus-visible:ring-red-400'
                        )}
                        {...register('contactInfo.phone')}
                      />
                      <FieldError
                        message={errors.contactInfo?.phone?.message}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 2 · Shipping Address */}
              <SectionCard>
                <SectionTitle step={2} title="Shipping Address" />

                {/* Saved addresses */}
                {user && savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Saved Addresses
                    </p>
                    <RadioGroup
                      value={useNewAddress ? 'new' : selectedAddressId}
                      onValueChange={handleAddressSelection}
                      className="space-y-2"
                    >
                      {savedAddresses.map((address) => (
                        <label
                          key={address._id ?? address.label}
                          htmlFor={address._id ?? address.label}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all',
                            !useNewAddress && selectedAddressId === address._id
                              ? 'border-primary bg-primary/5'
                              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                          )}
                        >
                          <RadioGroupItem
                            value={address._id ?? ''}
                            id={address._id ?? address.label}
                            className="mt-0.5"
                          />
                          <div className="flex-1 text-sm">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {address.label}
                            </p>
                            <p className="text-neutral-500">
                              {address.fullName}
                            </p>
                            <p className="text-neutral-400">
                              {address.address}, {address.city}, {address.state}{' '}
                              {address.zipCode}
                            </p>
                            {address.phone && (
                              <p className="text-neutral-400">
                                {address.phone}
                              </p>
                            )}
                          </div>
                          {address.isDefault && (
                            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white dark:bg-white dark:text-neutral-900">
                              Default
                            </span>
                          )}
                        </label>
                      ))}

                      <label
                        htmlFor="new"
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all',
                          useNewAddress
                            ? 'border-primary bg-primary/5'
                            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                        )}
                      >
                        <RadioGroupItem value="new" id="new" />
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Plus className="h-4 w-4" />
                          Use a new address
                        </span>
                      </label>
                    </RadioGroup>

                    <Separator className="my-5" />
                  </div>
                )}

                {/* Address form fields */}
                {(!user || useNewAddress || savedAddresses.length === 0) && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="shippingFullName"
                        className="text-sm font-medium"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingFullName"
                        placeholder="John Doe"
                        className={cn(
                          errors.shippingAddress?.fullName &&
                            'border-red-400 focus-visible:ring-red-400'
                        )}
                        {...register('shippingAddress.fullName')}
                      />
                      <FieldError
                        message={errors.shippingAddress?.fullName?.message}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="shippingStreet"
                        className="text-sm font-medium"
                      >
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="shippingStreet"
                        placeholder="123 Main St, Apt 4B"
                        rows={2}
                        className={cn(
                          'resize-none',
                          errors.shippingAddress?.address &&
                            'border-red-400 focus-visible:ring-red-400'
                        )}
                        {...register('shippingAddress.address')}
                      />
                      <FieldError
                        message={errors.shippingAddress?.address?.message}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="shippingCity"
                          className="text-sm font-medium"
                        >
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingCity"
                          placeholder="New York"
                          className={cn(
                            errors.shippingAddress?.city &&
                              'border-red-400 focus-visible:ring-red-400'
                          )}
                          {...register('shippingAddress.city')}
                        />
                        <FieldError
                          message={errors.shippingAddress?.city?.message}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="shippingState"
                          className="text-sm font-medium"
                        >
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingState"
                          placeholder="NY"
                          className={cn(
                            errors.shippingAddress?.state &&
                              'border-red-400 focus-visible:ring-red-400'
                          )}
                          {...register('shippingAddress.state')}
                        />
                        <FieldError
                          message={errors.shippingAddress?.state?.message}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="shippingZip"
                          className="text-sm font-medium"
                        >
                          ZIP <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingZip"
                          placeholder="10001"
                          className={cn(
                            errors.shippingAddress?.zipCode &&
                              'border-red-400 focus-visible:ring-red-400'
                          )}
                          {...register('shippingAddress.zipCode')}
                        />
                        <FieldError
                          message={errors.shippingAddress?.zipCode?.message}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="shippingCountry"
                          className="text-sm font-medium"
                        >
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingCountry"
                          placeholder="United States"
                          className={cn(
                            errors.shippingAddress?.country &&
                              'border-red-400 focus-visible:ring-red-400'
                          )}
                          {...register('shippingAddress.country')}
                        />
                        <FieldError
                          message={errors.shippingAddress?.country?.message}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="shippingPhone"
                          className="text-sm font-medium"
                        >
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingPhone"
                          placeholder="+1 (555) 000-0000"
                          className={cn(
                            errors.shippingAddress?.phone &&
                              'border-red-400 focus-visible:ring-red-400'
                          )}
                          {...register('shippingAddress.phone')}
                        />
                        <FieldError
                          message={errors.shippingAddress?.phone?.message}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* 3 · Billing Address */}
              <SectionCard>
                <SectionTitle step={3} title="Billing Address" />

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Same as shipping address
                  </span>
                </label>

                {!sameAsShipping && (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="billingFullName"
                        className="text-sm font-medium"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="billingFullName"
                        placeholder="John Doe"
                        {...register('billingAddress.fullName')}
                      />
                      <FieldError
                        message={errors.billingAddress?.fullName?.message}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="billingStreet"
                        className="text-sm font-medium"
                      >
                        Street Address
                      </Label>
                      <Textarea
                        id="billingStreet"
                        placeholder="123 Main St"
                        rows={2}
                        className="resize-none"
                        {...register('billingAddress.address')}
                      />
                      <FieldError
                        message={errors.billingAddress?.address?.message}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="billingCity"
                          className="text-sm font-medium"
                        >
                          City
                        </Label>
                        <Input
                          id="billingCity"
                          placeholder="New York"
                          {...register('billingAddress.city')}
                        />
                        <FieldError
                          message={errors.billingAddress?.city?.message}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="billingState"
                          className="text-sm font-medium"
                        >
                          State
                        </Label>
                        <Input
                          id="billingState"
                          placeholder="NY"
                          {...register('billingAddress.state')}
                        />
                        <FieldError
                          message={errors.billingAddress?.state?.message}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="billingZip"
                          className="text-sm font-medium"
                        >
                          ZIP
                        </Label>
                        <Input
                          id="billingZip"
                          placeholder="10001"
                          {...register('billingAddress.zipCode')}
                        />
                        <FieldError
                          message={errors.billingAddress?.zipCode?.message}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="billingCountry"
                        className="text-sm font-medium"
                      >
                        Country
                      </Label>
                      <Input
                        id="billingCountry"
                        placeholder="United States"
                        {...register('billingAddress.country')}
                      />
                      <FieldError
                        message={errors.billingAddress?.country?.message}
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* 4 · Shipping Method */}
              <SectionCard>
                <SectionTitle step={4} title="Shipping Method" />
                <RadioGroup
                  value={shippingMethod}
                  onValueChange={(value) => setValue('shippingMethod', value)}
                  className="space-y-2"
                >
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      htmlFor={method.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                        shippingMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                      )}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Truck
                        className={cn(
                          'h-4 w-4 shrink-0',
                          shippingMethod === method.id
                            ? 'text-primary'
                            : 'text-neutral-400'
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {method.name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {method.days}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        ${method.price.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.shippingMethod && (
                  <FieldError message={errors.shippingMethod.message} />
                )}
              </SectionCard>

              {/* 5 · Payment Method */}
              <SectionCard>
                <SectionTitle step={5} title="Payment Method" />
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className="space-y-2"
                >
                  {/* Credit Card */}
                  <label
                    htmlFor="credit_card"
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      paymentMethod === 'credit_card'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700',
                      !stripeConfigured &&
                        !checkingStripe &&
                        'cursor-not-allowed opacity-50'
                    )}
                  >
                    <RadioGroupItem
                      value="credit_card"
                      id="credit_card"
                      disabled={!stripeConfigured && !checkingStripe}
                    />
                    <CreditCard className="h-4 w-4 shrink-0 text-neutral-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Credit Card
                        {checkingStripe && (
                          <span className="ml-2 text-xs text-neutral-400">
                            Loading…
                          </span>
                        )}
                        {!stripeConfigured && !checkingStripe && (
                          <span className="ml-2 text-xs text-red-400">
                            Unavailable
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-9 items-center justify-center rounded bg-[#3D95CE] text-[9px] font-bold text-white">
                        VISA
                      </span>
                      <span className="flex h-5 w-9 items-center justify-center rounded bg-[#EB001B] text-[9px] font-bold text-white">
                        MC
                      </span>
                      <span className="flex h-5 w-9 items-center justify-center rounded bg-[#006FCF] text-[9px] font-bold text-white">
                        AMEX
                      </span>
                    </div>
                  </label>

                  {/* Debit Card */}
                  <label
                    htmlFor="debit_card"
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      paymentMethod === 'debit_card'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700',
                      !stripeConfigured &&
                        !checkingStripe &&
                        'cursor-not-allowed opacity-50'
                    )}
                  >
                    <RadioGroupItem
                      value="debit_card"
                      id="debit_card"
                      disabled={!stripeConfigured && !checkingStripe}
                    />
                    <CreditCard className="h-4 w-4 shrink-0 text-neutral-500" />
                    <p className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Debit Card
                    </p>
                  </label>

                  {/* PayPal */}
                  <label
                    htmlFor="paypal"
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      paymentMethod === 'paypal'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                    )}
                  >
                    <RadioGroupItem value="paypal" id="paypal" />
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0070BA]">
                      <span className="text-[8px] font-black text-white">
                        P
                      </span>
                    </div>
                    <p className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      PayPal
                    </p>
                    <span className="flex h-5 w-14 items-center justify-center rounded bg-[#0070BA] text-[9px] font-bold text-white">
                      PayPal
                    </span>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    htmlFor="cash_on_delivery"
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                    )}
                  >
                    <RadioGroupItem
                      value="cash_on_delivery"
                      id="cash_on_delivery"
                    />
                    <Banknote className="h-4 w-4 shrink-0 text-neutral-500" />
                    <p className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Cash on Delivery
                    </p>
                  </label>
                </RadioGroup>

                {stripeError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {stripeError}
                    </AlertDescription>
                  </Alert>
                )}
              </SectionCard>

              {/* 6 · Order Notes */}
              <SectionCard>
                <SectionTitle step={6} title="Order Notes" />
                <Textarea
                  placeholder="Special instructions, delivery notes, or preferences…"
                  rows={3}
                  className="resize-none text-sm"
                  {...register('notes')}
                />
              </SectionCard>

              {/* CTA */}
              <Button
                className="w-full gap-2 rounded-xl py-6 text-base font-semibold"
                type="button"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || creatingPaymentIntent}
              >
                {isSubmitting || creatingPaymentIntent ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {creatingPaymentIntent
                      ? 'Setting up payment…'
                      : 'Processing…'}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Place Order · ${orderTotal.toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-neutral-400">
                By placing your order you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>

            {/* ── Right: sticky order summary ──────────────────────── */}
            <div>
              <div className="sticky top-24 space-y-4">
                <SectionCard>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Order Summary
                  </p>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold text-white dark:bg-white dark:text-neutral-900">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex flex-1 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {item.name}
                            </p>
                            {item.selectedOptions && (
                              <p className="text-[11px] text-neutral-400">
                                {Object.values(item.selectedOptions).join(
                                  ' · '
                                )}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        Shipping
                        <span className="ml-1 text-neutral-400">
                          ({selectedShippingMethodObj.name})
                        </span>
                      </span>
                      <span>${selectedShippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Total
                    </span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                </SectionCard>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  <p className="text-[11px] text-neutral-400">
                    Secured by 256-bit SSL encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ── Payment Modal ─────────────────────────────────────────── */}
        <Dialog
          open={showPaymentModal}
          onOpenChange={(open) => {
            // Prevent dismissal while payment is processing
            if (!isSubmitting) setShowPaymentModal(open);
          }}
        >
          <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[460px]">
            <DialogHeader className="border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 dark:bg-white">
                  <CreditCard className="h-4 w-4 text-white dark:text-neutral-900" />
                </div>
                Complete Payment
              </DialogTitle>

              {/* Total + payment method summary */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    Order Total
                  </p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    ${orderTotal.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    Method
                  </p>
                  <p className="text-sm font-semibold capitalize text-neutral-700 dark:text-neutral-300">
                    {paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-5">
              {clientSecret && stripePromise && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: { colorPrimary: '#000000' }
                    }
                  }}
                >
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handleStripeSuccess}
                    onError={handleStripeError}
                    isProcessing={isSubmitting}
                    setIsProcessing={setIsSubmitting}
                  />
                </Elements>
              )}

              <Button
                variant="ghost"
                className="mt-3 w-full text-sm text-neutral-400 hover:text-neutral-600"
                onClick={closePaymentModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>

            {/* Security footer */}
            <div className="flex items-center justify-center gap-1.5 border-t border-neutral-200 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <Lock className="h-3 w-3 text-neutral-400" />
              <p className="text-[11px] text-neutral-400">
                Secured by Stripe · 256-bit TLS encryption
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
}
