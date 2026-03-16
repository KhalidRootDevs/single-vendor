'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  MapPin,
  Package,
  Send,
  Truck,
  User,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Order, OrderItem, TimelineEvent } from '@/types';

// Helper function to normalize customer data
const normalizeCustomer = (customer: any): Customer => {
  if (!customer) {
    return {
      id: 'unknown',
      name: 'Unknown Customer',
      email: 'unknown@example.com',
      phone: 'N/A',
      address: 'N/A'
    };
  }

  // If customer is populated from MongoDB with _id
  if (customer._id) {
    return {
      id: customer._id.toString(),
      _id: customer._id.toString(),
      name: customer.name || 'Unknown Customer',
      email: customer.email || 'unknown@example.com',
      phone: customer.phone || 'N/A',
      address: customer.address || 'N/A'
    };
  }

  // If customer already has id field
  return {
    id: customer.id || 'unknown',
    name: customer.name || 'Unknown Customer',
    email: customer.email || 'unknown@example.com',
    phone: customer.phone || 'N/A',
    address: customer.address || 'N/A'
  };
};

// Helper function to normalize timeline events
const normalizeTimeline = (timeline: any[]): TimelineEvent[] => {
  if (!timeline) return [];

  return timeline.map((event) => ({
    status: event.status,
    date: event.date,
    description: event.description,
    updatedBy: event.updatedBy // Keep as is, we'll handle rendering separately
  }));
};

// Helper function to normalize order items
const normalizeOrderItems = (items: any[]): OrderItem[] => {
  if (!items) return [];

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    variant: item.variant,
    productId: item.productId, // Keep as is
    sku: item.sku
  }));
};

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'capitalize bg-green-100 text-green-800 border-green-200';
    case 'shipped':
      return 'capitalize bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'capitalize bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending':
      return 'capitalize bg-orange-100 text-orange-800 border-orange-200';
    case 'cancelled':
      return 'capitalize bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'capitalize bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'capitalize bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'capitalize bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'capitalize bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'capitalize bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'capitalize bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'capitalize bg-gray-100 text-gray-800 border-gray-200';
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
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [note, setNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      // Normalize the order data to handle MongoDB populated objects
      const orderData = data.order;
      const normalizedOrder: Order = {
        ...orderData,
        customer: normalizeCustomer(orderData.customer),
        timeline: normalizeTimeline(orderData.timeline),
        items: normalizeOrderItems(orderData.items)
      };

      setOrder(normalizedOrder);
      setStatus(normalizedOrder.status);
      setInternalNote(normalizedOrder.notes || '');
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load order',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Order Not Found
            </h2>
            <p className="text-muted-foreground">
              The requested order does not exist.
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
      minute: '2-digit'
    });
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          notes: internalNote
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      // Normalize the updated order data
      const normalizedOrder: Order = {
        ...data.order,
        customer: normalizeCustomer(data.order.customer),
        timeline: normalizeTimeline(data.order.timeline),
        items: normalizeOrderItems(data.order.items)
      };

      setOrder(normalizedOrder);
      toast({
        title: 'Status updated',
        description: `Order status has been updated to ${getStatusText(
          status
        )}.`
      });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update order status',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    if (!note.trim()) {
      toast({
        title: 'Note required',
        description: 'Please enter a note to send to the customer.',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Simulate email API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'Email sent',
        description: 'Your note has been sent to the customer.'
      });
      setNote('');
    } catch (error) {
      toast({
        title: 'Email failed',
        description: 'Failed to send email to customer.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle internal note update
  const handleInternalNoteUpdate = async () => {
    if (!order) return;

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: internalNote
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notes');
      }

      // Normalize the updated order data
      const normalizedOrder: Order = {
        ...data.order,
        customer: normalizeCustomer(data.order.customer),
        timeline: normalizeTimeline(data.order.timeline),
        items: normalizeOrderItems(data.order.items)
      };

      setOrder(normalizedOrder);
      toast({
        title: 'Notes updated',
        description: 'Internal notes have been updated.'
      });
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update notes',
        variant: 'destructive'
      });
    }
  };

  // Generate and download invoice PDF
  const generateInvoicePDF = () => {
    if (!order) return;

    const doc = new jsPDF();

    // Add company logo and information
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLT COMMERCE', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 E-Commerce Street', 14, 30);
    doc.text('New York, NY 10001', 14, 35);
    doc.text('support@boltcommerce.com', 14, 40);
    doc.text('(555) 123-4567', 14, 45);

    // Add invoice title and details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 140, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: INV-${order.orderNumber}`, 140, 30);
    doc.text(`Order #: ${order.orderNumber}`, 140, 35);
    doc.text(`Date: ${formatDate(order.createdAt)}`, 140, 40);
    doc.text(`Status: ${getStatusText(order.status)}`, 140, 45);

    // Add customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress.fullName, 14, 67);
    doc.text(order.shippingAddress.address, 14, 72);
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
      14,
      77
    );
    doc.text(order.shippingAddress.country, 14, 82);
    doc.text(`Email: ${order.customer.email}`, 14, 87);
    doc.text(`Phone: ${order.shippingAddress.phone}`, 14, 92);

    // Add payment information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', 140, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getPaymentMethodText(order.paymentMethod), 140, 67);

    if (order.paymentMethod === 'credit_card' && order.cardDetails) {
      doc.text(
        `${order.cardDetails.type} ending in ${order.cardDetails.last4}`,
        140,
        72
      );
    }

    doc.text(`Payment Status: ${order.paymentStatus}`, 140, 77);

    // Add order items table
    const tableColumn = ['Item', 'Price', 'Qty', 'Total'];
    const tableRows = order.items.map((item) => [
      `${item.name}\n${
        item.variant?.attributes
          ? Object.values(item.variant.attributes).join(', ')
          : ''
      }`,
      `$${item.price.toFixed(2)}`,
      item.quantity,
      `$${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 100,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' }
      },
      styles: { overflow: 'linebreak' },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add order summary
    doc.setFontSize(10);
    doc.text('Subtotal:', 130, finalY);
    doc.text(`$${order.subtotal.toFixed(2)}`, 175, finalY, { align: 'right' });

    if (order.discount) {
      doc.text('Discount:', 130, finalY + 7);
      doc.text(`-$${order.discount.toFixed(2)}`, 175, finalY + 7, {
        align: 'right'
      });
    }

    doc.text('Tax:', 130, finalY + (order.discount ? 14 : 7));
    doc.text(
      `$${order.tax.toFixed(2)}`,
      175,
      finalY + (order.discount ? 14 : 7),
      { align: 'right' }
    );

    doc.text('Shipping:', 130, finalY + (order.discount ? 21 : 14));
    doc.text(
      order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`,
      175,
      finalY + (order.discount ? 21 : 14),
      { align: 'right' }
    );

    doc.setLineWidth(0.5);
    doc.line(
      130,
      finalY + (order.discount ? 24 : 17),
      175,
      finalY + (order.discount ? 24 : 17)
    );

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, finalY + (order.discount ? 31 : 24));
    doc.text(
      `$${order.total.toFixed(2)}`,
      175,
      finalY + (order.discount ? 31 : 24),
      {
        align: 'right'
      }
    );

    // Add shipping information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Shipping Information:', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${order.shippingMethod}`, 14, finalY + 7);

    if (order.trackingNumber) {
      doc.text(`Tracking Number: ${order.trackingNumber}`, 14, finalY + 14);
    }

    // Add footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 105, finalY + 40, {
      align: 'center'
    });
    doc.text(
      'For questions about this invoice, please contact our customer service.',
      105,
      finalY + 45,
      {
        align: 'center'
      }
    );

    doc.save(`Invoice-${order.orderNumber}.pdf`);
  };

  const getVariantText = (variant: OrderItem['variant']) => {
    if (!variant?.attributes) return '';
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  // Safely render customer information
  const renderCustomerInfo = () => {
    if (!order.customer) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">
              {order.shippingAddress?.fullName || order.customer.name || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              Customer ID: {order.customer.id || 'N/A'}
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Email:</span>{' '}
            {order.customer.email || 'N/A'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Phone:</span>{' '}
            {order.shippingAddress?.phone || order.customer.phone || 'N/A'}
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${order.customer.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Customer
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Order {order.orderNumber}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={generateInvoicePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
            <Button variant="outline" size="sm">
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
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
                          <th className="px-4 py-3.5 text-left text-sm font-semibold">
                            Product
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-semibold">
                            Price
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-semibold">
                            Quantity
                          </th>
                          <th className="px-4 py-3.5 text-right text-sm font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
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
                            <td className="px-4 py-4 text-sm">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-right text-sm">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th
                            colSpan={3}
                            className="px-4 py-3.5 text-right text-sm font-normal"
                          >
                            Subtotal
                          </th>
                          <td className="px-4 py-3.5 text-right text-sm">
                            ${order.subtotal.toFixed(2)}
                          </td>
                        </tr>
                        {order.discount && (
                          <tr>
                            <th
                              colSpan={3}
                              className="px-4 py-3.5 text-right text-sm font-normal"
                            >
                              Discount
                            </th>
                            <td className="px-4 py-3.5 text-right text-sm">
                              -${order.discount.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th
                            colSpan={3}
                            className="px-4 py-3.5 text-right text-sm font-normal"
                          >
                            Tax
                          </th>
                          <td className="px-4 py-3.5 text-right text-sm">
                            ${order.tax.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <th
                            colSpan={3}
                            className="px-4 py-3.5 text-right text-sm font-normal"
                          >
                            Shipping
                          </th>
                          <td className="px-4 py-3.5 text-right text-sm">
                            {order.shipping === 0
                              ? 'Free'
                              : `$${order.shipping.toFixed(2)}`}
                          </td>
                        </tr>
                        <tr className="border-t border-t-2">
                          <th
                            colSpan={3}
                            className="px-4 py-3.5 text-right text-base font-medium"
                          >
                            Total
                          </th>
                          <td className="px-4 py-3.5 text-right text-base font-medium">
                            ${order.total.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="email">Email Customer</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Timeline</CardTitle>
                    <CardDescription>
                      Track the progress of this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative border-l pl-6">
                      {order.timeline.map((event, index) => (
                        <div key={index} className="mb-8 last:mb-0">
                          <div className="absolute -left-[6.5px] h-3 w-3 rounded-full bg-primary"></div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${getStatusColor(
                                  event.status
                                )} px-2 py-1 text-xs capitalize`}
                              >
                                {getStatusText(event.status)}
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
                  <CardFooter className="flex justify-between border-t pt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Update Status:
                      </span>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={isUpdatingStatus || status === order.status}
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Status'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                    <CardDescription>
                      Internal notes about this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add internal notes about this order..."
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        rows={4}
                      />
                      <Button onClick={handleInternalNoteUpdate}>
                        Save Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="email" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Customer</CardTitle>
                    <CardDescription>
                      Send a message to {order.shippingAddress.fullName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-subject">Subject</Label>
                        <Input
                          id="email-subject"
                          defaultValue={`Your order ${order.orderNumber}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-message">Message</Label>
                        <Textarea
                          id="email-message"
                          placeholder="Enter your message to the customer..."
                          rows={5}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>{renderCustomerInfo()}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Shipping Address</div>
                      <div className="text-sm text-muted-foreground">
                        {order.shippingAddress.fullName}
                        <br />
                        {order.shippingAddress.address}
                        <br />
                        {order.shippingAddress.city},{' '}
                        {order.shippingAddress.state}{' '}
                        {order.shippingAddress.zipCode}
                        <br />
                        {order.shippingAddress.country}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Shipping Method:</span>{' '}
                      {order.shippingMethod}
                    </div>
                    {order.trackingNumber && (
                      <div className="text-sm">
                        <span className="font-medium">Tracking Number:</span>{' '}
                        {order.trackingNumber}
                      </div>
                    )}
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Truck className="mr-2 h-4 w-4" />
                        Track Package
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {getPaymentMethodText(order.paymentMethod)}
                      </div>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(order.paymentStatus)}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {order.paymentMethod === 'credit_card' &&
                      order.cardDetails && (
                        <div className="text-sm">
                          <span className="font-medium">Card:</span>{' '}
                          {order.cardDetails.type} ending in{' '}
                          {order.cardDetails.last4}
                        </div>
                      )}
                    <div className="text-sm">
                      <span className="font-medium">Amount:</span> $
                      {order.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.billingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>{order.billingAddress.fullName}</div>
                    <div>{order.billingAddress.address}</div>
                    <div>
                      {order.billingAddress.city}, {order.billingAddress.state}{' '}
                      {order.billingAddress.zipCode}
                    </div>
                    <div>{order.billingAddress.country}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
