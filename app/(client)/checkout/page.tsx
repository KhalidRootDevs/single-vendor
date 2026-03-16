'use client';

import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { CheckCircle2, AlertCircle, CreditCard, Plus, X } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Address } from '@/types';
import { CheckoutFormValues, checkoutSchema } from '@/lib/validations/index';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

// Shipping method options
const shippingMethods = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    price: 5.99,
    days: '5-7 business days'
  },
  {
    id: 'express',
    name: 'Express Shipping',
    price: 12.99,
    days: '2-3 business days'
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    price: 24.99,
    days: '1 business day'
  }
];

export default function CheckoutPage() {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeError, setStripeError] = useState('');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // New state for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

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

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        setSavedAddresses(data.addresses || []);

        // Auto-select default address if available
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
      // Clear form fields
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
    formState: { errors, isValid }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      contactInfo: {
        fullName: '',
        email: '',
        phone: ''
      },
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

  // Watch form values
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

  // Update shipping cost when shipping method changes
  useEffect(() => {
    const selectedMethod = shippingMethods.find(
      (method) => method.id === shippingMethod
    );
    if (selectedMethod) {
      console.log('Selected shipping method:', selectedMethod);
    }
  }, [shippingMethod]);

  const createPaymentIntent = async () => {
    try {
      setCreatingPaymentIntent(true);
      setStripeError('');

      if (!total || total <= 0) throw new Error('Invalid order total');

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
          metadata: {
            orderItems: items.length.toString(),
            customerEmail: contactInfo.email || 'guest@example.com',
            customerName: contactInfo.fullName,
            orderTotal: total.toString()
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
    // Trigger validation for all fields
    const isValid = await trigger();

    if (!isValid) {
      toast.error(
        'Validation error! Please fill in all required fields correctly.'
      );

      return;
    }

    if (items.length === 0) {
      toast.error(
        'Cart is empty! Please add items to your cart before checking out.'
      );

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

        toast.error(
          'Payment unavailable! Please choose another payment option.'
        );

        return;
      }

      // Create payment intent and show modal
      const intentCreated = await createPaymentIntent();
      if (intentCreated) {
        setShowPaymentModal(true);
      }
    } else {
      // For non-card payments, process directly
      const formData = getValues();
      await processOrder(formData);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    // This function is now handled by handlePlaceOrder
    // Keeping it for the form's onSubmit handler
  };

  const processOrder = async (
    data: CheckoutFormValues,
    paymentIntent?: any
  ) => {
    setIsSubmitting(true);
    try {
      // Map cart items to order items format
      const orderItems = items.map((item, index) => ({
        id: index + 1, // Sequential ID for order items
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
        sku: item.sku || `${item.productId}-default`
      }));

      // Get selected shipping method details
      const selectedShippingMethod = shippingMethods.find(
        (method) => method.id === data.shippingMethod
      );

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
        paymentStatus:
          data.paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
        paymentIntentId: paymentIntent?.id || paymentIntentId,
        shippingMethod: selectedShippingMethod?.name || 'Standard Shipping',
        notes: data.notes,
        subtotal,
        tax,
        shipping: selectedShippingMethod?.price || shipping,
        total: total + (selectedShippingMethod?.price || 0) - shipping,
        timeline: [
          {
            status: 'order_placed' as const,
            date: new Date(),
            description: 'Order was placed by customer'
          }
        ]
      };

      console.log('📦 Sending order data to /api/orders:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      console.log('✅ Order API response:', result);

      if (!response.ok)
        throw new Error(result.error || 'Failed to create order');

      setOrderId(result.order.orderNumber);
      clearCart();
      setOrderComplete(true);
      setShowPaymentModal(false);

      toast.success(
        `Your order ${result.order.orderNumber} has been confirmed.`
      );
    } catch (error: any) {
      console.error('❌ Error processing order:', error);

      toast.error(
        'There was an error processing your order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSuccess = (paymentIntent: any) => {
    const formData = getValues();

    console.log('✅ Stripe payment success, intent:', paymentIntent);
    processOrder(formData, paymentIntent);
  };

  const handleStripeError = (error: string) => {
    console.error('❌ Stripe payment error:', error);
    setStripeError(error);
    setShowPaymentModal(false);
  };

  const handlePaymentMethodChange = (value: string) => {
    console.log('🔄 Setting payment method to:', value);
    setValue(
      'paymentMethod',
      value as 'credit_card' | 'debit_card' | 'paypal' | 'cash_on_delivery'
    );
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setStripeError('');
  };

  if (!isMounted) return null;

  if (orderComplete) {
    return (
      <Container className="mx-auto max-w-3xl py-12 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold">Order Confirmed!</h1>
        <p className="mb-8 text-muted-foreground">
          Thank you for your purchase. Your order has been received and is being
          processed.
        </p>
        <div className="mb-8 rounded-lg bg-muted p-6">
          <h2 className="mb-4 text-xl font-semibold">Order Details</h2>
          <div className="mb-2 flex justify-between">
            <span>Order Number:</span>
            <span className="font-medium">{orderId}</span>
          </div>
          <div className="mb-2 flex justify-between">
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          {paymentIntentId && (
            <div className="mt-2 flex justify-between">
              <span>Payment ID:</span>
              <span className="text-xs font-medium">{paymentIntentId}</span>
            </div>
          )}
        </div>
        <p className="mb-8">
          We've sent a confirmation email with your order details.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">View Orders</Link>
          </Button>
        </div>
      </Container>
    );
  }

  if (items.length === 0 && isMounted) {
    router.push('/cart');
    return null;
  }

  return (
    <Container>
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    {...register('contactInfo.fullName')}
                  />
                  {errors.contactInfo?.fullName && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.fullName.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      {...register('contactInfo.email')}
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1 (123) 456-7890"
                      {...register('contactInfo.phone')}
                    />
                    {errors.contactInfo?.phone && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select Address</Label>
                    <RadioGroup
                      value={useNewAddress ? 'new' : selectedAddressId}
                      onValueChange={handleAddressSelection}
                      className="space-y-2"
                    >
                      {savedAddresses.map((address) => (
                        <div
                          key={address._id}
                          className="flex items-start space-x-2 rounded-md border p-3"
                        >
                          <RadioGroupItem
                            value={address._id}
                            id={address._id}
                          />
                          <Label
                            htmlFor={address._id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{address.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.address}, {address.city}, {address.state}{' '}
                              {address.zipCode}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.phone}
                            </div>
                          </Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2 rounded-md border border-dashed p-3">
                        <RadioGroupItem value="new" id="new" />
                        <Label
                          htmlFor="new"
                          className="flex flex-1 cursor-pointer items-center"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Use a new address
                        </Label>
                      </div>
                    </RadioGroup>
                    <Separator className="my-4" />
                  </div>
                )}

                {(!user || useNewAddress || savedAddresses.length === 0) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shippingFullName">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingFullName"
                        placeholder="John Doe"
                        {...register('shippingAddress.fullName')}
                      />
                      {errors.shippingAddress?.fullName && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="shippingAddress"
                        placeholder="123 Main St, Apt 4B"
                        {...register('shippingAddress.address')}
                      />
                      {errors.shippingAddress?.address && (
                        <p className="text-sm text-red-500">
                          {errors.shippingAddress.address.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="shippingCity">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingCity"
                          placeholder="New York"
                          {...register('shippingAddress.city')}
                        />
                        {errors.shippingAddress?.city && (
                          <p className="text-sm text-red-500">
                            {errors.shippingAddress.city.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingState">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingState"
                          placeholder="NY"
                          {...register('shippingAddress.state')}
                        />
                        {errors.shippingAddress?.state && (
                          <p className="text-sm text-red-500">
                            {errors.shippingAddress.state.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingZipCode">
                          ZIP Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingZipCode"
                          placeholder="10001"
                          {...register('shippingAddress.zipCode')}
                        />
                        {errors.shippingAddress?.zipCode && (
                          <p className="text-sm text-red-500">
                            {errors.shippingAddress.zipCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shippingCountry">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingCountry"
                          placeholder="United States"
                          {...register('shippingAddress.country')}
                        />
                        {errors.shippingAddress?.country && (
                          <p className="text-sm text-red-500">
                            {errors.shippingAddress.country.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingPhone">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingPhone"
                          placeholder="+1 (123) 456-7890"
                          {...register('shippingAddress.phone')}
                        />
                        {errors.shippingAddress?.phone && (
                          <p className="text-sm text-red-500">
                            {errors.shippingAddress.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sameAsShipping">
                    Same as shipping address
                  </Label>
                </div>

                {!sameAsShipping && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="billingFullName">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billingFullName"
                        placeholder="John Doe"
                        {...register('billingAddress.fullName')}
                      />
                      {errors.billingAddress?.fullName && (
                        <p className="text-sm text-red-500">
                          {errors.billingAddress.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="billingAddress"
                        placeholder="123 Main St, Apt 4B"
                        {...register('billingAddress.address')}
                      />
                      {errors.billingAddress?.address && (
                        <p className="text-sm text-red-500">
                          {errors.billingAddress.address.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billingCity"
                          placeholder="New York"
                          {...register('billingAddress.city')}
                        />
                        {errors.billingAddress?.city && (
                          <p className="text-sm text-red-500">
                            {errors.billingAddress.city.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingState">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billingState"
                          placeholder="NY"
                          {...register('billingAddress.state')}
                        />
                        {errors.billingAddress?.state && (
                          <p className="text-sm text-red-500">
                            {errors.billingAddress.state.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingZipCode">
                          ZIP Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billingZipCode"
                          placeholder="10001"
                          {...register('billingAddress.zipCode')}
                        />
                        {errors.billingAddress?.zipCode && (
                          <p className="text-sm text-red-500">
                            {errors.billingAddress.zipCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billingCountry"
                        placeholder="United States"
                        {...register('billingAddress.country')}
                      />
                      {errors.billingAddress?.country && (
                        <p className="text-sm text-red-500">
                          {errors.billingAddress.country.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={shippingMethod}
                  onValueChange={(value) => setValue('shippingMethod', value)}
                  className="space-y-3"
                >
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center space-x-2 rounded-md border p-4"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {method.days}
                            </p>
                          </div>
                          <div className="font-medium">
                            ${method.price.toFixed(2)}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.shippingMethod && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.shippingMethod.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-center space-x-2 rounded-md border p-4 ${
                      !stripeConfigured && !checkingStripe ? 'opacity-50' : ''
                    }`}
                  >
                    <RadioGroupItem
                      value="credit_card"
                      id="credit_card"
                      disabled={!stripeConfigured && !checkingStripe}
                    />
                    <Label
                      htmlFor="credit_card"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Credit Card
                        {checkingStripe && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Loading...)
                          </span>
                        )}
                        {!stripeConfigured && !checkingStripe && (
                          <span className="ml-2 text-sm text-red-500">
                            (Unavailable)
                          </span>
                        )}
                      </div>
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex h-6 w-10 items-center justify-center rounded bg-[#3D95CE] text-xs font-bold text-white">
                        VISA
                      </div>
                      <div className="flex h-6 w-10 items-center justify-center rounded bg-[#EB001B] text-xs font-bold text-white">
                        MC
                      </div>
                      <div className="flex h-6 w-10 items-center justify-center rounded bg-[#006FCF] text-xs font-bold text-white">
                        AMEX
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      PayPal
                    </Label>
                    <div className="flex h-6 w-16 items-center justify-center rounded bg-[#0070BA] text-xs font-bold text-white">
                      PayPal
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem
                      value="cash_on_delivery"
                      id="cash_on_delivery"
                    />
                    <Label
                      htmlFor="cash_on_delivery"
                      className="flex-1 cursor-pointer"
                    >
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>

                {stripeError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{stripeError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special instructions or notes for your order..."
                  {...register('notes')}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Place Order Button - Always visible */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  size="lg"
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || creatingPaymentIntent}
                >
                  {isSubmitting || creatingPaymentIntent ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {creatingPaymentIntent
                        ? 'Setting up payment...'
                        : 'Processing...'}
                    </div>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="line-clamp-1 font-medium">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.selectedOptions
                                ? Object.values(item.selectedOptions).join(', ')
                                : 'Default'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Enter your card details to complete the payment of $
              {total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          {clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#000000'
                  }
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
            className="mt-2"
            onClick={closePaymentModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
