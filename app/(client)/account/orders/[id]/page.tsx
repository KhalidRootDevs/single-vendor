'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Order, OrderItem } from '@/types';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  Package,
  Truck,
  User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'paypal':
      return 'PayPal';
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    default:
      return method;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load order details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVariantText = (variant: OrderItem['variant']) => {
    if (!variant?.attributes) return '';
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const downloadInvoice = async () => {
    if (!order) return;

    try {
      const response = await fetch(
        `/api/user/orders/${order.orderNumber}/invoice`
      );
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Invoice downloaded',
        description: `Invoice for order ${order.orderNumber} has been downloaded.`
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download invoice. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const trackPackage = () => {
    if (!order?.trackingNumber) {
      toast({
        title: 'No tracking available',
        description: 'Tracking number is not available for this order yet.',
        variant: 'destructive'
      });
      return;
    }

    // This would typically redirect to the carrier's tracking page
    toast({
      title: 'Track Package',
      description: `Tracking number: ${order.trackingNumber}`
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Order Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The order you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/account/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadInvoice}>
            <Download className="mr-2 h-4 w-4" />
            Invoice
          </Button>
          {order.trackingNumber && (
            <Button variant="outline" size="sm" onClick={trackPackage}>
              <Truck className="mr-2 h-4 w-4" />
              Track Package
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Order Summary</CardTitle>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={item.image || '/placeholder.svg'}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.variant?.attributes && (
                                  <div className="text-xs text-muted-foreground">
                                    {getVariantText(item.variant)}
                                  </div>
                                )}
                                {item.sku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {item.sku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th
                          colSpan={3}
                          className="px-4 py-3 text-right text-sm font-normal"
                        >
                          Subtotal
                        </th>
                        <td className="px-4 py-3 text-right text-sm">
                          ${order.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      {order.discount && (
                        <tr>
                          <th
                            colSpan={3}
                            className="px-4 py-3 text-right text-sm font-normal"
                          >
                            Discount
                          </th>
                          <td className="px-4 py-3 text-right text-sm">
                            -${order.discount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <th
                          colSpan={3}
                          className="px-4 py-3 text-right text-sm font-normal"
                        >
                          Tax
                        </th>
                        <td className="px-4 py-3 text-right text-sm">
                          ${order.tax.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <th
                          colSpan={3}
                          className="px-4 py-3 text-right text-sm font-normal"
                        >
                          Shipping
                        </th>
                        <td className="px-4 py-3 text-right text-sm">
                          {order.shipping === 0
                            ? 'Free'
                            : `$${order.shipping.toFixed(2)}`}
                        </td>
                      </tr>
                      <tr className="border-t border-t-2">
                        <th
                          colSpan={3}
                          className="px-4 py-3 text-right text-base font-medium"
                        >
                          Total
                        </th>
                        <td className="px-4 py-3 text-right text-base font-medium">
                          ${order.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
              <CardDescription>
                Track the progress of your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l pl-6">
                {order.timeline.map((event, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    <div className="absolute -left-[6.5px] h-3 w-3 rounded-full border-2 border-background bg-primary"></div>
                    <div className="flex flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(event.status)}
                        >
                          {getStatusText(event.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      <p className="text-sm">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email}
                </p>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Phone:</span>{' '}
                  {order.shippingAddress.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Method:</span>{' '}
                  {order.shippingMethod}
                </div>
                {order.trackingNumber && (
                  <div>
                    <span className="font-medium">Tracking:</span>{' '}
                    {order.trackingNumber}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {getPaymentMethodText(order.paymentMethod)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    getPaymentStatusColor(order.paymentStatus),
                    'capitalize'
                  )}
                >
                  {order.paymentStatus}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                {order.paymentMethod === 'credit_card' && order.cardDetails && (
                  <div>
                    <span className="font-medium">Card:</span>{' '}
                    {order.cardDetails.type} ending in {order.cardDetails.last4}
                  </div>
                )}
                <div>
                  <span className="font-medium">Amount:</span> $
                  {order.total.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          {order.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.billingAddress.fullName}</p>
                  <p>{order.billingAddress.address}</p>
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state}{' '}
                    {order.billingAddress.zipCode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
