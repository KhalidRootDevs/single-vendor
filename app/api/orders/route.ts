import { type NextRequest, NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { escapeRegex } from '@/lib/utils';

const ALLOWED_ORDER_SORT_FIELDS = [
  'createdAt',
  'total',
  'status',
  'orderNumber',
  'paymentStatus',
  'date'
];

const TAX_RATE = 0.08;

const SHIPPING_METHODS: Record<string, number> = {
  standard: 5.99,
  express: 12.99,
  overnight: 24.99
};

/**
 * POST /api/orders
 * Creates a new order
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    let userId;
    let userEmail;
    let isGuest = false;

    // Check if user is authenticated
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
      // Guest user specific fields
      customer,

      createAccount = true // Option to create account for guest
    } = body;

    // Validate required fields
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
    if (!userId) {
      if (!customer?.email) {
        return NextResponse.json(
          { error: 'Email is required for guest checkout' },
          { status: 400 }
        );
      }

      // Check if user already exists with this email
      let existingUser = await User.findOne({
        email: customer?.email.toLowerCase()
      });

      if (existingUser) {
        // Use existing user
        userId = existingUser._id;
        userEmail = existingUser.email;
        isGuest = false;
      } else if (createAccount) {
        // Create new user account for guest
        const password = randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 12);

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
          guestAccount: true // Mark as guest account that was auto-created
        });

        await newUser.save();
        userId = newUser._id;
        userEmail = newUser.email;
        isGuest = true;

        // TODO: Send welcome email with password
        // await sendWelcomeEmail(guestEmail, shippingAddress.fullName, password);
      } else {
        // Create order without user account (true guest checkout)
        userId = new mongoose.Types.ObjectId();
        userEmail = customer?.email;
        isGuest = true;
      }
    }

    // Validate stock availability and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

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

      // Check stock for specific variant or base product
      let availableStock = product.stock;
      let variantPrice = product.price;

      if (item.variant && item.variant.attributes) {
        // Find matching variant
        const variant = product.variants.find((v) => {
          return Object.keys(item.variant.attributes).every(
            (key) => v.attributes[key] === item.variant.attributes[key]
          );
        });

        if (variant) {
          availableStock = variant.stock || 0;
          variantPrice = variant.price || product.price;
        }
      }

      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name}` },
          { status: 400 }
        );
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
    }

    // Calculate tax and shipping server-side (source of truth)
    const tax = subtotal * TAX_RATE;
    const shipping =
      SHIPPING_METHODS[shippingMethod] ?? SHIPPING_METHODS.standard;
    const total = subtotal + tax + shipping;

    // Generate order number
    const generateOrderNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `ORD-${year}${month}${day}-${random}`;
    };

    // Create order data
    const orderData = {
      orderNumber: generateOrderNumber(),
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
      total,
      paymentMethod,
      // Only trust 'paid' status when a verified paymentIntentId is present
      paymentStatus: paymentIntentId ? paymentStatus || 'paid' : 'pending',
      paymentIntentId: paymentIntentId || undefined,
      cardDetails,
      shippingMethod,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes,
      guestOrder: isGuest // Mark if this is a guest order
    };

    const order = await Order.create(orderData);

    // Update product stock
    for (const item of validatedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      if (item.variant && item.variant.attributes) {
        const variantIndex = product.variants.findIndex((v: any) =>
          Object.keys(item.variant.attributes).every(
            (key: string) => v.attributes[key] === item.variant.attributes[key]
          )
        );
        if (variantIndex !== -1) {
          product.variants[variantIndex].stock = Math.max(
            0,
            (product.variants[variantIndex].stock ?? 0) - item.quantity
          );
        }
      } else {
        product.stock = Math.max(0, product.stock - item.quantity);
      }

      product.salesCount += item.quantity;
      await product.save();
    }

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer.id', 'name email')
      .lean();

    // Prepare response
    const responseData: any = {
      message: 'Order created successfully',
      order: populatedOrder
    };

    // Add guest account info if account was created
    if (isGuest && createAccount) {
      responseData.guestAccountCreated = true;
      responseData.message =
        'Order created successfully. Account has been created for you.';
      // In a real implementation, you would send the email here
      // responseData.emailSent = true;
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
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
 * Fetches orders with pagination and filtering
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

    const query: any = {};

    // Filter by customer (non-admin users see only their orders)
    if (decoded.role !== 'admin') {
      query['customer.id'] = decoded.userId;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Payment status filter
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

    const orders = await Order.find(query)
      .populate('customer.id', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Order.countDocuments(query);
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
