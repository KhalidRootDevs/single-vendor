'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Receipt,
  RefreshCw,
  User,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock payment data (same as in the list page)
const payments = {
  'PAY-001': {
    id: 'PAY-001',
    transactionId: 'txn_1234567890abcdef',
    orderId: 'ORD-001',
    customer: {
      id: 'CUST-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567'
    },
    date: '2023-06-15T14:35:12Z',
    amount: 159.98,
    fee: 4.95,
    net: 155.03,
    method: 'Credit Card',
    cardDetails: {
      type: 'Visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '2025',
      country: 'US'
    },
    status: 'Completed',
    currency: 'USD',
    description: 'Payment for Order ORD-001',
    billingAddress: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    timeline: [
      {
        status: 'Initiated',
        date: '2023-06-15T14:35:00Z',
        description: 'Payment initiated by customer'
      },
      {
        status: 'Processing',
        date: '2023-06-15T14:35:05Z',
        description: 'Payment being processed by payment gateway'
      },
      {
        status: 'Completed',
        date: '2023-06-15T14:35:12Z',
        description: 'Payment successfully completed'
      }
    ],
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      riskScore: 'Low'
    }
  },
  'PAY-002': {
    id: 'PAY-002',
    transactionId: 'txn_abcdef1234567890',
    orderId: 'ORD-002',
    customer: {
      id: 'CUST-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543'
    },
    date: '2023-06-14T10:16:05Z',
    amount: 79.99,
    fee: 2.55,
    net: 77.44,
    method: 'PayPal',
    paypalDetails: {
      email: 'jane.smith@example.com',
      payerId: 'PAYERID123456'
    },
    status: 'Completed',
    currency: 'USD',
    description: 'Payment for Order ORD-002',
    billingAddress: {
      line1: '456 Oak Ave',
      city: 'Somewhere',
      state: 'CA',
      postalCode: '90210',
      country: 'USA'
    },
    timeline: [
      {
        status: 'Initiated',
        date: '2023-06-14T10:15:55Z',
        description: 'Payment initiated via PayPal'
      },
      {
        status: 'Completed',
        date: '2023-06-14T10:16:05Z',
        description: 'PayPal payment completed'
      }
    ],
    metadata: {
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0...',
      riskScore: 'Low'
    }
  },
  'PAY-003': {
    id: 'PAY-003',
    transactionId: 'txn_xyz9876543210abc',
    orderId: 'ORD-003',
    customer: {
      id: 'CUST-003',
      name: 'Robert Johnson',
      email: 'robert.johnson@example.com',
      phone: '+1 (555) 456-7890'
    },
    date: '2023-06-14T16:47:10Z',
    amount: 249.97,
    fee: 7.75,
    net: 242.22,
    method: 'Credit Card',
    cardDetails: {
      type: 'Mastercard',
      last4: '5678',
      expiryMonth: '08',
      expiryYear: '2026',
      country: 'US'
    },
    status: 'Completed',
    currency: 'USD',
    description: 'Payment for Order ORD-003',
    billingAddress: {
      line1: '789 Pine St',
      city: 'Elsewhere',
      state: 'TX',
      postalCode: '75001',
      country: 'USA'
    },
    timeline: [
      {
        status: 'Initiated',
        date: '2023-06-14T16:47:00Z',
        description: 'Payment initiated by customer'
      },
      {
        status: 'Processing',
        date: '2023-06-14T16:47:03Z',
        description: 'Payment being processed'
      },
      {
        status: 'Completed',
        date: '2023-06-14T16:47:10Z',
        description: 'Payment successfully completed'
      }
    ],
    metadata: {
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0...',
      riskScore: 'Low'
    }
  },
  'PAY-005': {
    id: 'PAY-005',
    transactionId: 'txn_failed789xyz',
    orderId: 'ORD-009',
    customer: {
      id: 'CUST-009',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      phone: '+1 (555) 321-9876'
    },
    date: '2023-06-09T15:45:20Z',
    amount: 89.99,
    fee: 0,
    net: 0,
    method: 'Credit Card',
    cardDetails: {
      type: 'Visa',
      last4: '1234',
      expiryMonth: '03',
      expiryYear: '2024',
      country: 'US'
    },
    status: 'Failed',
    currency: 'USD',
    description: 'Payment for Order ORD-009',
    failureReason: 'Insufficient funds',
    billingAddress: {
      line1: '321 Elm St',
      city: 'Anytown',
      state: 'FL',
      postalCode: '33101',
      country: 'USA'
    },
    timeline: [
      {
        status: 'Initiated',
        date: '2023-06-09T15:45:10Z',
        description: 'Payment initiated by customer'
      },
      {
        status: 'Failed',
        date: '2023-06-09T15:45:20Z',
        description: 'Payment failed: Insufficient funds'
      }
    ],
    metadata: {
      ipAddress: '192.168.1.5',
      userAgent: 'Mozilla/5.0...',
      riskScore: 'Medium'
    }
  },
  'PAY-006': {
    id: 'PAY-006',
    transactionId: 'txn_refund456def',
    orderId: 'ORD-005',
    customer: {
      id: 'CUST-005',
      name: 'Michael Wilson',
      email: 'michael.wilson@example.com',
      phone: '+1 (555) 876-5432'
    },
    date: '2023-06-12T11:30:15Z',
    amount: -89.98,
    fee: -2.79,
    net: -87.19,
    method: 'Credit Card',
    cardDetails: {
      type: 'Visa',
      last4: '9876',
      expiryMonth: '06',
      expiryYear: '2025',
      country: 'US'
    },
    status: 'Refunded',
    currency: 'USD',
    description: 'Refund for Order ORD-005',
    refundReason: 'Customer requested cancellation',
    originalPaymentId: 'PAY-005-ORIGINAL',
    billingAddress: {
      line1: '654 Maple Dr',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA'
    },
    timeline: [
      {
        status: 'Refund Initiated',
        date: '2023-06-12T11:30:00Z',
        description: 'Refund initiated by admin'
      },
      {
        status: 'Refunded',
        date: '2023-06-12T11:30:15Z',
        description: 'Refund successfully processed'
      }
    ],
    metadata: {
      ipAddress: 'Admin Panel',
      userAgent: 'Admin',
      riskScore: 'N/A'
    }
  }
};

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Processing':
      return 'bg-blue-100 text-blue-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Refunded':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'Processing':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'Pending':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'Failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'Refunded':
      return <RefreshCw className="h-5 w-5 text-purple-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-600" />;
  }
};

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;
  const payment = payments[paymentId as keyof typeof payments];

  const [isRefunding, setIsRefunding] = useState(false);

  if (!payment) {
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
              The requested payment does not exist.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Handle refund
  const handleRefund = async () => {
    setIsRefunding(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: 'Refund initiated',
      description:
        'The refund has been successfully initiated and will be processed shortly.'
    });

    setIsRefunding(false);
  };

  // Download receipt
  const downloadReceipt = () => {
    toast({
      title: 'Receipt downloaded',
      description: 'The payment receipt has been downloaded.'
    });
  };

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
                Payment {payment.id}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(payment.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadReceipt}>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            {payment.status === 'Completed' && payment.amount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefund}
                disabled={isRefunding}
              >
                {isRefunding ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Issue Refund
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {payment.status === 'Failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              {payment.failureReason ||
                'This payment transaction failed. Please check the details below.'}
            </AlertDescription>
          </Alert>
        )}

        {payment.status === 'Refunded' && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Payment Refunded</AlertTitle>
            <AlertDescription>
              {payment.refundReason ||
                'This payment has been refunded to the customer.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {/* Payment Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Payment Summary</CardTitle>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Transaction ID
                      </div>
                      <div className="font-mono text-sm">
                        {payment.transactionId}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Order ID
                      </div>
                      <Link
                        href={`/admin/orders/${payment.orderId}`}
                        className="text-primary hover:underline"
                      >
                        {payment.orderId}
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        ${Math.abs(payment.amount).toFixed(2)}{' '}
                        {payment.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Processing Fee
                      </span>
                      <span className="font-medium">
                        ${Math.abs(payment.fee).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Net Amount</span>
                      <span className="font-bold">
                        ${Math.abs(payment.net).toFixed(2)} {payment.currency}
                      </span>
                    </div>
                  </div>

                  {payment.description && (
                    <>
                      <Separator />
                      <div>
                        <div className="mb-1 text-sm text-muted-foreground">
                          Description
                        </div>
                        <div className="text-sm">{payment.description}</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Timeline</CardTitle>
                    <CardDescription>
                      Track the progress of this payment transaction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative border-l pl-6">
                      {payment.timeline.map((event, index) => (
                        <div key={index} className="mb-8 last:mb-0">
                          <div className="absolute -left-[6.5px] h-3 w-3 rounded-full bg-primary"></div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="metadata" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Metadata</CardTitle>
                    <CardDescription>
                      Additional information about this transaction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payment.metadata && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                IP Address
                              </div>
                              <div className="font-mono text-sm">
                                {payment.metadata.ipAddress}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Risk Score
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  payment.metadata.riskScore === 'Low'
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : payment.metadata.riskScore === 'Medium'
                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                                }
                              >
                                {payment.metadata.riskScore}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-sm text-muted-foreground">
                              User Agent
                            </div>
                            <div className="rounded bg-muted p-2 font-mono text-xs">
                              {payment.metadata.userAgent}
                            </div>
                          </div>
                        </>
                      )}
                      {payment.originalPaymentId && (
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Original Payment ID
                          </div>
                          <div className="font-mono text-sm">
                            {payment.originalPaymentId}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {payment.customer.id}
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
                      <div className="font-medium">{payment.method}</div>
                      {payment.cardDetails && (
                        <div className="text-sm text-muted-foreground">
                          {payment.cardDetails.type} ••
                          {payment.cardDetails.last4}
                        </div>
                      )}
                      {payment.paypalDetails && (
                        <div className="text-sm text-muted-foreground">
                          {payment.paypalDetails.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {payment.cardDetails && (
                      <>
                        <div className="text-sm">
                          <span className="font-medium">Card Type:</span>{' '}
                          {payment.cardDetails.type}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Last 4 Digits:</span>{' '}
                          {payment.cardDetails.last4}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Expiry:</span>{' '}
                          {payment.cardDetails.expiryMonth}/
                          {payment.cardDetails.expiryYear}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Country:</span>{' '}
                          {payment.cardDetails.country}
                        </div>
                      </>
                    )}
                    {payment.paypalDetails && (
                      <>
                        <div className="text-sm">
                          <span className="font-medium">PayPal Email:</span>{' '}
                          {payment.paypalDetails.email}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Payer ID:</span>{' '}
                          {payment.paypalDetails.payerId}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div>{payment.billingAddress.line1}</div>
                  {payment.billingAddress.line2 && (
                    <div>{payment.billingAddress.line2}</div>
                  )}
                  <div>
                    {payment.billingAddress.city},{' '}
                    {payment.billingAddress.state}{' '}
                    {payment.billingAddress.postalCode}
                  </div>
                  <div>{payment.billingAddress.country}</div>
                </div>
              </CardContent>
            </Card>

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
                      <div className="font-medium">Order {payment.orderId}</div>
                      <div className="text-sm text-muted-foreground">
                        View order details
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href={`/admin/orders/${payment.orderId}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Order
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
