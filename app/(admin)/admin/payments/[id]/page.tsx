'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Package,
  Receipt,
  RefreshCw,
  User,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PaymentDetail {
  _id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  paymentMethod: string;
  paymentStatus: string;
  cardDetails?: {
    type: string;
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  } | null;
  paymentIntentId?: string | null;
  refundId?: string | null;
  refundedAmount?: number | null;
  refundedAt?: string | null;
  status: string;
  shippingMethod: string;
  trackingNumber?: string | null;
  notes?: string | null;
  timeline: Array<{
    status: string;
    date: string;
    description: string;
  }>;
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  } | null;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    image: string;
    sku?: string | null;
  }>;
}

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-5 w-5 text-yellow-600" />
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-5 w-5 text-red-600" />
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-800',
    icon: <RefreshCw className="h-5 w-5 text-purple-600" />
  }
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
  cash_on_delivery: 'Cash on Delivery'
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getStatusInfo(paymentStatus: string) {
  return (
    PAYMENT_STATUS_MAP[paymentStatus] ?? {
      label: paymentStatus,
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  );
}

export default function PaymentDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmRefundOpen, setConfirmRefundOpen] = useState(false);

  const fetchPayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load payment');
      }
      const data = await res.json();
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleRefund = async () => {
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Refund failed');
      }

      toast({
        title: 'Refund issued',
        description: data.message
      });
      // Pull the server's version rather than patching local state — the
      // refund also writes a timeline event and may restock inventory.
      await fetchPayment();
    } catch (err) {
      toast({
        title: 'Refund failed',
        description: err instanceof Error ? err.message : 'Refund failed',
        variant: 'destructive'
      });
    } finally {
      setIsRefunding(false);
      setConfirmRefundOpen(false);
    }
  };

  const downloadReceipt = async () => {
    if (!payment) return;
    setIsDownloading(true);
    try {
      // Loaded on demand — jsPDF is heavy and most visits never print.
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const money = (n: number) => `$${n.toFixed(2)}`;

      doc.setFontSize(18);
      doc.text('Payment Receipt', 14, 20);

      doc.setFontSize(10);
      doc.text(`Order: ${payment.orderNumber}`, 14, 30);
      doc.text(`Date: ${formatDate(payment.createdAt)}`, 14, 36);
      doc.text(
        `Payment method: ${
          PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod
        }`,
        14,
        42
      );
      doc.text(`Status: ${getStatusInfo(payment.paymentStatus).label}`, 14, 48);

      doc.text(`Billed to: ${payment.customer.name}`, 14, 60);
      doc.text(payment.customer.email, 14, 66);
      if (payment.billingAddress) {
        const a = payment.billingAddress;
        doc.text(a.address, 14, 72);
        doc.text(`${a.city}, ${a.state} ${a.zipCode}, ${a.country}`, 14, 78);
      }

      autoTable(doc, {
        startY: 88,
        head: [['Item', 'Qty', 'Unit price', 'Amount']],
        body: payment.items.map((item) => [
          item.name,
          String(item.quantity),
          money(item.price),
          money(item.price * item.quantity)
        ]),
        foot: [
          ['', '', 'Subtotal', money(payment.subtotal)],
          ['', '', 'Tax', money(payment.tax)],
          ['', '', 'Shipping', money(payment.shipping)],
          ...(payment.discount
            ? [['', '', 'Discount', `-${money(payment.discount)}`]]
            : []),
          ...(payment.refundedAmount
            ? [['', '', 'Refunded', `-${money(payment.refundedAmount)}`]]
            : []),
          ['', '', 'Total', `${money(payment.total)} USD`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 30, 30] },
        footStyles: { fillColor: [245, 245, 245], textColor: 20 }
      });

      doc.save(`receipt-${payment.orderNumber}.pdf`);

      toast({
        title: 'Receipt downloaded',
        description: `receipt-${payment.orderNumber}.pdf`
      });
    } catch (err) {
      toast({
        title: 'Could not generate receipt',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/payments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Payment Not Found
            </h2>
            <p className="text-muted-foreground">
              {error ?? 'The requested payment does not exist.'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchPayment}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Container>
    );
  }

  const statusInfo = getStatusInfo(payment.paymentStatus);
  const isCard =
    payment.paymentMethod === 'credit_card' ||
    payment.paymentMethod === 'debit_card';

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {payment.orderNumber}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(payment.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadReceipt}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Preparing...' : 'Download Receipt'}
            </Button>
            {payment.paymentStatus === 'paid' && (
              <AlertDialog
                open={confirmRefundOpen}
                onOpenChange={setConfirmRefundOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isRefunding}>
                    {isRefunding ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Issue Refund
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Refund ${payment.total.toFixed(2)}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {payment.paymentIntentId
                        ? `This sends the full ${payment.orderNumber} amount back through Stripe. Stripe refunds cannot be reversed.`
                        : `${payment.orderNumber} has no Stripe payment attached, so this records the refund and restocks the items — you still need to return the funds to the customer yourself.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isRefunding}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleRefund();
                      }}
                      disabled={isRefunding}
                    >
                      {isRefunding ? 'Processing...' : 'Confirm refund'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {payment.paymentStatus === 'failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              This payment transaction failed. Please check the details below.
            </AlertDescription>
          </Alert>
        )}

        {payment.paymentStatus === 'refunded' && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Payment Refunded</AlertTitle>
            <AlertDescription>
              {payment.refundedAmount != null
                ? `$${payment.refundedAmount.toFixed(2)} refunded${
                    payment.refundedAt
                      ? ` on ${formatDate(payment.refundedAt)}`
                      : ''
                  }${
                    payment.refundId
                      ? ` — Stripe refund ${payment.refundId}`
                      : ' — recorded manually, settle the funds directly'
                  }.`
                : 'This payment has been refunded to the customer.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {/* Payment Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Payment Summary</CardTitle>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Order Number
                      </div>
                      <div className="font-mono text-sm">
                        {payment.orderNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Payment Method
                      </div>
                      <div className="text-sm font-medium">
                        {PAYMENT_METHOD_LABEL[payment.paymentMethod] ??
                          payment.paymentMethod}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        ${payment.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">
                        ${payment.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        ${payment.shipping.toFixed(2)}
                      </span>
                    </div>
                    {payment.discount != null && payment.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-green-600">
                          -${payment.discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">
                        ${payment.total.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Description
                      </div>
                      <div className="text-sm">
                        Payment for Order {payment.orderNumber}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Transaction ID
                      </div>
                      <div className="break-all font-mono text-sm">
                        {payment.paymentIntentId ?? (
                          <span className="font-sans text-muted-foreground">
                            Not processed through Stripe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline + Items */}
            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                {payment.notes && (
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Timeline</CardTitle>
                    <CardDescription>
                      Track the progress of this order and payment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payment.timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No timeline events yet.
                      </p>
                    ) : (
                      <div className="relative border-l pl-6">
                        {payment.timeline.map((event, index) => (
                          <div key={index} className="mb-8 last:mb-0">
                            <div className="absolute -left-[6.5px] h-3 w-3 rounded-full bg-primary" />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {event.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.date)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                    <CardDescription>
                      Items included in this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {payment.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 py-3"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {item.name}
                            </div>
                            {item.sku && (
                              <div className="font-mono text-xs text-muted-foreground">
                                SKU: {item.sku}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </div>
                            <div className="text-muted-foreground">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {payment.notes && (
                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{payment.notes}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.customer.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {payment.customer.id}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Email:</span>{' '}
                      {payment.customer.email}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Phone:</span>{' '}
                      {payment.customer.phone}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/users/${payment.customer.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Customer
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {PAYMENT_METHOD_LABEL[payment.paymentMethod] ??
                          payment.paymentMethod}
                      </div>
                      {payment.cardDetails && (
                        <div className="text-sm text-muted-foreground">
                          {payment.cardDetails.type} ••
                          {payment.cardDetails.last4}
                        </div>
                      )}
                    </div>
                  </div>
                  {isCard && payment.cardDetails && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Type:</span>{' '}
                          {payment.cardDetails.type}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Last 4:</span> ••••{' '}
                          {payment.cardDetails.last4}
                        </div>
                        {payment.cardDetails.expiryMonth != null &&
                          payment.cardDetails.expiryYear != null && (
                            <div className="text-sm">
                              <span className="font-medium">Expiry:</span>{' '}
                              {String(payment.cardDetails.expiryMonth).padStart(
                                2,
                                '0'
                              )}
                              /{payment.cardDetails.expiryYear}
                            </div>
                          )}
                      </div>
                    </>
                  )}
                  {payment.paymentMethod === 'paypal' && (
                    <>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        Payment via PayPal
                      </div>
                    </>
                  )}
                  {payment.paymentMethod === 'cash_on_delivery' && (
                    <>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        Payment collected on delivery
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            {payment.billingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {payment.billingAddress.fullName}
                    </div>
                    <div>{payment.billingAddress.address}</div>
                    <div>
                      {payment.billingAddress.city},{' '}
                      {payment.billingAddress.state}{' '}
                      {payment.billingAddress.zipCode}
                    </div>
                    <div>{payment.billingAddress.country}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Order */}
            <Card>
              <CardHeader>
                <CardTitle>Related Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.orderNumber}</div>
                      <div className="text-sm capitalize text-muted-foreground">
                        Status: {payment.status}
                      </div>
                    </div>
                  </div>
                  {payment.trackingNumber && (
                    <div className="text-sm">
                      <span className="font-medium">Tracking:</span>{' '}
                      <span className="font-mono">
                        {payment.trackingNumber}
                      </span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Shipping:</span>{' '}
                    {payment.shippingMethod}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href={`/admin/orders/${payment._id}`}>
                      <Package className="mr-2 h-4 w-4" />
                      View Full Order
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
