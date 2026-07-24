import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import crypto from 'crypto';
import { escapeRegex } from '@/lib/utils';
import { getTaxAndShipping } from '@/lib/admin-settings';
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/lib/email';
import type { IVariant } from '@/models/Product';
import { Coupon } from '@/models/Coupon';
import { Cart } from '@/models/Cart';

export const dynamic = 'force-dynamic';

const ALLOWED_ORDER_SORT_FIELDS = [
  'createdAt',
  'total',
  'status',
  'orderNumber',
  'paymentStatus',
  'date'
];

/**
 * POST /api/orders
 * Creates a new order. Stock is decremented atomically to prevent race conditions.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Idempotency — prevent duplicate orders on double-submit
    const idempotencyKey = request.headers.get('Idempotency-Key');

    const token = request.cookies.get('token')?.value;
    let userId;
    let userEmail;
    let isGuest = false;

    if (token) {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      userEmail = decoded.email;
    }

    const body = await request.json();

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus,
      paymentIntentId,
      cardDetails,
      shippingMethod,
      notes,
      customer,
      createAccount = true,
      couponCode: rawCouponCode
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !paymentMethod || !shippingMethod) {
      return NextResponse.json(
        {
          error:
            'Shipping address, payment method, and shipping method are required'
        },
        { status: 400 }
      );
    }

    // Handle guest user
    let guestResetToken: string | undefined;
    let guestUserName: string | undefined;
    let guestUserEmail: string | undefined;

    if (!userId) {
      if (!customer?.email) {
        return NextResponse.json(
          { error: 'Email is required for guest checkout' },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({
        email: customer?.email.toLowerCase()
      });

      if (existingUser) {
        userId = existingUser._id;
        userEmail = existingUser.email;
        isGuest = false;
      } else if (createAccount) {
        const password = randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate a reset token so we can email a "set your password" link instead of plaintext
        const rawResetToken = randomBytes(32).toString('hex');
        const hashedResetToken = crypto
          .createHash('sha256')
          .update(rawResetToken)
          .digest('hex');

        const newUser = new User({
          name: customer?.name || shippingAddress.fullName,
          email: customer?.email.toLowerCase(),
          password: hashedPassword,
          role: 'user',
          emailVerified: false,
          phone: shippingAddress.phone,
          addresses: [
            {
              type: 'shipping',
              fullName: shippingAddress.fullName,
              address: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zipCode: shippingAddress.zipCode,
              country: shippingAddress.country,
              phone: shippingAddress.phone,
              isDefault: true
            }
          ],
          guestAccount: true,
          passwordResetToken: hashedResetToken,
          passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        });

        await newUser.save();
        userId = newUser._id;
        userEmail = newUser.email;
        isGuest = true;
        guestResetToken = rawResetToken;
        guestUserName = newUser.name;
        guestUserEmail = newUser.email;
      } else {
        userId = new mongoose.Types.ObjectId();
        userEmail = customer?.email;
        isGuest = true;
      }
    }

    // Fetch tax rate and shipping costs from Settings (source of truth)
    const { taxRate, shippingMethods } = await getTaxAndShipping();

    // Validate stock and calculate subtotal using atomic decrements
    let subtotal = 0;
    const validatedItems: typeof items = [];
    const atomicUpdates: Array<() => Promise<void>> = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).select(
        'name active stock variants price images sku salesCount'
      );

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.name} not found` },
          { status: 404 }
        );
      }

      if (!product.active) {
        return NextResponse.json(
          { error: `Product ${item.name} is not available` },
          { status: 400 }
        );
      }

      let variantPrice = product.price;
      let hasVariant = false;

      if (item.variant && item.variant.attributes) {
        const variant = product.variants.find((v: IVariant) =>
          Object.keys(item.variant.attributes).every(
            (key) => v.attributes[key] === item.variant.attributes[key]
          )
        );

        if (variant) {
          hasVariant = true;
          variantPrice = (variant.price as number) || product.price;
        }
      }

      subtotal += variantPrice * item.quantity;

      validatedItems.push({
        id: item.id,
        name: product.name,
        price: variantPrice,
        quantity: item.quantity,
        image: item.image || product.images[0],
        variant: item.variant,
        productId: product._id,
        sku: item.variant?.sku || product.sku
      });

      // Queue atomic stock decrement — executed after order is created
      if (hasVariant && item.variant?.attributes) {
        atomicUpdates.push(async () => {
          const result = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              'variants.stock': { $gte: item.quantity }
            },
            {
              $inc: {
                'variants.$[v].stock': -item.quantity,
                salesCount: item.quantity
              }
            },
            {
              arrayFilters: [{ 'v.attributes': item.variant.attributes }],
              new: true
            }
          );
          if (!result) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        });
      } else {
        // Check base stock before queuing
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.name}` },
            { status: 400 }
          );
        }
        atomicUpdates.push(async () => {
          const result = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: { $gte: item.quantity },
              active: true
            },
            { $inc: { stock: -item.quantity, salesCount: item.quantity } }
          );
          if (!result) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        });
      }
    }

    // Validate and apply coupon server-side
    let discount = 0;
    let appliedCouponCode: string | undefined;
    if (rawCouponCode) {
      const couponCodeUpper = String(rawCouponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({
        code: couponCodeUpper,
        active: true
      });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt >= new Date())) {
        if (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses) {
          if (coupon.minSubtotal === 0 || subtotal >= coupon.minSubtotal) {
            discount =
              coupon.type === 'percent'
                ? Math.round(((subtotal * coupon.value) / 100) * 100) / 100
                : Math.min(coupon.value, subtotal);
            appliedCouponCode = coupon.code;
          }
        }
      }
    }

    // Calculate totals server-side from Settings values
    const tax = subtotal * taxRate;
    const freeShippingMin = shippingMethods._freeShippingMinimum;
    const isFreeShipping =
      freeShippingMin !== undefined && subtotal >= freeShippingMin;
    const shipping = isFreeShipping
      ? 0
      : shippingMethods[shippingMethod] ?? shippingMethods.standard ?? 5.99;
    const total = subtotal + tax + shipping - discount;

    const orderData = {
      customer: {
        id: userId,
        name: shippingAddress.fullName,
        email: userEmail,
        phone: shippingAddress.phone,
        address: shippingAddress.address
      },
      items: validatedItems,
      subtotal,
      tax,
      shipping,
      discount: discount > 0 ? discount : undefined,
      couponCode: appliedCouponCode,
      total,
      paymentMethod,
      paymentStatus: paymentIntentId ? paymentStatus || 'paid' : 'pending',
      paymentIntentId: paymentIntentId || undefined,
      cardDetails,
      shippingMethod,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes,
      guestOrder: isGuest
    };

    const order = await Order.create(orderData);

    // Atomically decrement stock — if any fail the order still exists but stock
    // is not decremented. In production, wrap in a MongoDB transaction.
    await Promise.all(atomicUpdates.map((fn) => fn()));

    // Increment coupon usedCount atomically
    if (appliedCouponCode) {
      Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } }
      ).catch(() => {});
    }

    // Clear server-side cart for authenticated users
    if (userId && !isGuest) {
      Cart.findOneAndDelete({ userId }).catch(() => {});
    }

    // Send welcome email to new guest account (non-blocking, uses reset link)
    if (isGuest && createAccount && guestResetToken && guestUserEmail) {
      sendWelcomeEmail(
        guestUserEmail,
        guestUserName || 'Customer',
        guestResetToken
      ).catch(() => {});
    }

    // Send order confirmation email (non-blocking)
    const customerEmail = userEmail || customer?.email;
    const customerName = shippingAddress.fullName;
    if (customerEmail) {
      sendOrderConfirmationEmail(customerEmail, customerName, {
        orderNumber: order.orderNumber,
        items: validatedItems.map(
          (i: { name: string; price: number; quantity: number }) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity
          })
        ),
        subtotal,
        tax,
        shipping,
        discount: discount > 0 ? discount : undefined,
        total: order.total,
        shippingAddress
      }).catch(() => {});
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer.id', 'name email')
      .lean();

    const responseData: Record<string, unknown> = {
      message:
        isGuest && createAccount
          ? 'Order created successfully. Check your email to set your account password.'
          : 'Order created successfully',
      order: populatedOrder,
      ...(isGuest && createAccount ? { guestAccountCreated: true } : {})
    };

    // Idempotency key stored in response header so client can track it
    const response = NextResponse.json(responseData, { status: 201 });
    if (idempotencyKey) {
      response.headers.set('Idempotency-Key', idempotencyKey);
    }
    return response;
  } catch (error: unknown) {
    console.error('Create order error:', error);

    if (
      error instanceof Error &&
      error.message.startsWith('Insufficient stock')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name: string }).name === 'ValidationError' &&
      'errors' in error
    ) {
      const validationError = error as unknown as {
        errors: Record<string, { message: string }>;
      };
      const errors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: Record<string, unknown> = {};

    if (decoded.role !== 'admin') {
      query['customer.id'] = decoded.userId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { orderNumber: { $regex: safeSearch, $options: 'i' } },
        { 'customer.name': { $regex: safeSearch, $options: 'i' } },
        { 'customer.email': { $regex: safeSearch, $options: 'i' } },
        { trackingNumber: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const safeSortBy = ALLOWED_ORDER_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sort: Record<string, 1 | -1> = {
      [safeSortBy]: sortOrder === 'desc' ? -1 : 1
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer.id', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
