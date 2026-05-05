import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IOrderItem } from '@/models/Order';

export const dynamic = 'force-dynamic';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

/**
 * GET /api/user/orders/[id]/invoice
 * Generate and download invoice for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const { id } = params;

    // Find order by orderNumber (user-friendly) or _id
    const order = await Order.findOne({
      $or: [
        { orderNumber: id, 'customer.id': userId },
        { _id: id, 'customer.id': userId }
      ]
    })
      .populate('items.productId', 'name images sku')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shippingAddress) {
      return NextResponse.json(
        { error: 'Order has no shipping address' },
        { status: 422 }
      );
    }

    // Create PDF invoice
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
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      140,
      40
    );
    doc.text(`Status: ${order.status}`, 140, 45);

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

    const paymentMethodText =
      order.paymentMethod === 'credit_card'
        ? 'Credit Card'
        : order.paymentMethod === 'debit_card'
        ? 'Debit Card'
        : order.paymentMethod === 'paypal'
        ? 'PayPal'
        : order.paymentMethod === 'cash_on_delivery'
        ? 'Cash on Delivery'
        : order.paymentMethod;

    doc.text(paymentMethodText, 140, 67);

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
    const tableRows = order.items.map((item: IOrderItem) => [
      item.name,
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

    const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;

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

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
