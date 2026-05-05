import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const order = await Order.findById(id)
      .populate('timeline.updatedBy', 'name email')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      payment: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: {
          id: order.customer.id.toString(),
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone
        },
        createdAt: order.createdAt,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        cardDetails: order.cardDetails ?? null,
        status: order.status,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber ?? null,
        notes: order.notes ?? null,
        timeline: order.timeline.map((t) => ({
          status: t.status,
          date: t.date,
          description: t.description
        })),
        billingAddress: order.billingAddress ?? null,
        shippingAddress: order.shippingAddress ?? null,
        items: order.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          sku: item.sku ?? null
        }))
      }
    });
  } catch (error) {
    console.error('Get admin payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
