import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { isMongooseValidationError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/[id]
 * Admin endpoint to fetch a single order with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    const order = await Order.findById(id)
      .populate('customer.id', 'name email phone')
      .populate('items.productId', 'name images sku')
      .populate('timeline.updatedBy', 'name email');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get admin order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Admin endpoint to update order status, notes, and timeline
 */
export async function PATCH(
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

    const { id } = params;
    const body = await request.json();
    const { status, notes, trackingNumber, paymentStatus, timelineEvent } =
      body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status if provided
    if (status && status !== order.status) {
      order.status = status;
    }

    // Update payment status if provided
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Update tracking number if provided
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;

      // Add tracking update to timeline if tracking number is set
      if (trackingNumber && trackingNumber !== order.trackingNumber) {
        order.timeline.push({
          status: 'shipped',
          date: new Date(),
          description: `Tracking number updated: ${trackingNumber}`,
          updatedBy: new mongoose.Types.ObjectId(decoded.userId)
        });
      }
    }

    // Update notes if provided
    if (notes !== undefined) {
      order.notes = notes;
    }

    // Add custom timeline event if provided
    if (timelineEvent && timelineEvent.status && timelineEvent.description) {
      order.timeline.push({
        status: timelineEvent.status,
        date: new Date(),
        description: timelineEvent.description,
        updatedBy: new mongoose.Types.ObjectId(decoded.userId)
      });
    }

    await order.save();

    // Return populated order
    const updatedOrder = await Order.findById(id)
      .populate('customer.id', 'name email phone')
      .populate('items.productId', 'name images sku')
      .populate('timeline.updatedBy', 'name email');

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error: unknown) {
    console.error('Update order error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders/[id]
 * Admin endpoint to add timeline events to an order
 */
export async function POST(
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

    const { id } = params;
    const body = await request.json();
    const { status, description } = body;

    if (!status || !description) {
      return NextResponse.json(
        { error: 'Status and description are required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.timeline.push({
      status,
      date: new Date(),
      description,
      updatedBy: new mongoose.Types.ObjectId(decoded.userId)
    });

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('customer.id', 'name email phone')
      .populate('items.productId', 'name images sku')
      .populate('timeline.updatedBy', 'name email');

    return NextResponse.json({
      message: 'Timeline event added successfully',
      order: updatedOrder
    });
  } catch (error: unknown) {
    console.error('Add timeline event error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/orders/[id]
 * Admin endpoint to cancel an order
 */
export async function DELETE(
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

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status to cancelled
    order.status = 'cancelled';

    // Add cancellation to timeline
    order.timeline.push({
      status: 'cancelled',
      date: new Date(),
      description: reason || 'Order was cancelled by admin',
      updatedBy: new mongoose.Types.ObjectId(decoded.userId)
    });

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('customer.id', 'name email phone')
      .populate('items.productId', 'name images sku')
      .populate('timeline.updatedBy', 'name email');

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error: unknown) {
    console.error('Cancel order error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
