import mongoose, { type Document, type Model, Schema } from 'mongoose';
import type { OrderStatus, PaymentStatus, PaymentMethod } from '@/types';

export type { OrderStatus, PaymentStatus, PaymentMethod };

export interface ICustomer {
  id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ICardDetails {
  type: string;
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface IOrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    sku?: string;
    attributes: Record<string, string>; // Dynamic attributes like { color: "Red", size: "M" }
  };
  productId?: mongoose.Types.ObjectId;
  sku?: string;
}

export interface ITimelineEvent {
  status: OrderStatus | 'payment_confirmed' | 'order_placed';
  date: Date;
  description: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: ICustomer;
  date: Date;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cardDetails?: ICardDetails;
  shippingMethod: string;
  trackingNumber?: string;
  items: IOrderItem[];
  timeline: ITimelineEvent[];
  notes?: string;
  /** True once inventory has been restocked (on cancellation). Prevents double restore. */
  stockRestored?: boolean;
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Customer address is required'],
    trim: true
  }
});

const cardDetailsSchema = new Schema<ICardDetails>({
  type: {
    type: String,
    required: [true, 'Card type is required'],
    trim: true
  },
  last4: {
    type: String,
    required: [true, 'Last 4 digits are required'],
    match: [/^\d{4}$/, 'Last 4 digits must be 4 numbers']
  },
  brand: {
    type: String,
    trim: true
  },
  expiryMonth: {
    type: Number,
    min: 1,
    max: 12
  },
  expiryYear: {
    type: Number,
    min: new Date().getFullYear()
  }
});

const orderItemSchema = new Schema<IOrderItem>({
  id: {
    type: Number,
    required: [true, 'Item ID is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price must be positive']
  },
  quantity: {
    type: Number,
    required: [true, 'Item quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  image: {
    type: String,
    required: [true, 'Item image is required']
  },
  variant: {
    sku: {
      type: String,
      trim: true
    },
    attributes: {
      type: Schema.Types.Mixed, // Stores JSON object like { color: "Red", size: "M" }
      default: {}
    }
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  sku: {
    type: String,
    trim: true
  }
});

const timelineEventSchema = new Schema<ITimelineEvent>({
  status: {
    type: String,
    required: [true, 'Timeline status is required'],
    enum: {
      values: [
        'order_placed',
        'payment_confirmed',
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ],
      message: 'Invalid timeline status'
    }
  },
  date: {
    type: Date,
    required: [true, 'Timeline date is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Timeline description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: customerSchema,
      required: [true, 'Customer information is required']
    },
    date: {
      type: Date,
      required: [true, 'Order date is required'],
      default: Date.now
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total must be positive']
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal amount is required'],
      min: [0, 'Subtotal must be positive']
    },
    tax: {
      type: Number,
      required: [true, 'Tax amount is required'],
      min: [0, 'Tax must be positive']
    },
    shipping: {
      type: Number,
      required: [true, 'Shipping amount is required'],
      min: [0, 'Shipping must be positive']
    },
    discount: {
      type: Number,
      min: [0, 'Discount must be positive']
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    status: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: [
          'pending',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        ],
        message: 'Invalid order status'
      },
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: [
          'credit_card',
          'debit_card',
          'paypal',
          'bank_transfer',
          'cash_on_delivery'
        ],
        message: 'Invalid payment method'
      }
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Invalid payment status'
      },
      default: 'pending'
    },
    cardDetails: {
      type: cardDetailsSchema
    },
    shippingMethod: {
      type: String,
      required: [true, 'Shipping method is required'],
      trim: true
    },
    trackingNumber: {
      type: String,
      trim: true
    },
    items: [orderItemSchema],
    timeline: [timelineEventSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    stockRestored: {
      type: Boolean,
      default: false
    },
    shippingAddress: {
      fullName: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    billingAddress: {
      fullName: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true }
    }
  },
  {
    timestamps: true
  }
);

// Order number generation — must run on `validate`, not `save`, because Mongoose
// runs schema validation BEFORE pre('save') hooks. Since `orderNumber` is a
// required field, generating it here ensures it exists before validation runs.
orderSchema.pre<IOrder>('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    let orderNumber: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();

      orderNumber = `ORD-${year}${month}${day}-${random}`;
      attempts++;

      // Check if order number already exists
      const existingOrder = await mongoose.models.Order?.findOne({
        orderNumber
      });
      if (!existingOrder) {
        this.orderNumber = orderNumber;
        break;
      }

      if (attempts >= maxAttempts) {
        // Fallback: use timestamp to ensure uniqueness
        const timestamp = Date.now().toString(36);
        this.orderNumber = `ORD-${year}${month}${day}-${timestamp}`;
        break;
      }
    } while (attempts < maxAttempts);
  }
  next();
});

// Auto-add timeline events when status changes
orderSchema.pre<IOrder>('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    const statusDescriptions: Record<OrderStatus, string> = {
      pending: 'Order was placed by customer',
      processing: 'Order is being processed',
      shipped: `Order has been shipped via ${this.shippingMethod}`,
      delivered: 'Order was delivered',
      cancelled: 'Order was cancelled',
      refunded: 'Order was refunded'
    };

    if (statusDescriptions[this.status]) {
      this.timeline.push({
        status: this.status,
        date: new Date(),
        description: statusDescriptions[this.status]
      });
    }
  }
  next();
});

// Auto-add payment confirmed timeline event
orderSchema.pre<IOrder>('save', function (next) {
  if (
    this.isModified('paymentStatus') &&
    this.paymentStatus === 'paid' &&
    !this.isNew
  ) {
    const hasPaymentConfirmed = this.timeline.some(
      (event) => event.status === 'payment_confirmed'
    );
    if (!hasPaymentConfirmed) {
      this.timeline.push({
        status: 'payment_confirmed',
        date: new Date(),
        description: 'Payment was confirmed'
      });
    }
  }
  next();
});

// Auto-add order placed timeline event for new orders
orderSchema.pre<IOrder>('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'order_placed',
      date: new Date(),
      description: 'Order was placed by customer'
    });
  }
  next();
});

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function () {
  const totalOrders = await this.countDocuments();
  const totalRevenue = await this.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);

  const statusCounts = await this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    statusCounts: statusCounts.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    )
  };
};

// Instance method to update order status
orderSchema.methods.updateStatus = function (
  newStatus: OrderStatus,
  updatedBy?: mongoose.Types.ObjectId,
  description?: string
) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    date: new Date(),
    description: description || `Order status updated to ${newStatus}`,
    updatedBy
  });
  return this.save();
};

// Instance method to add timeline event
orderSchema.methods.addTimelineEvent = function (
  status: ITimelineEvent['status'],
  description: string,
  updatedBy?: mongoose.Types.ObjectId
) {
  this.timeline.push({
    status,
    date: new Date(),
    description,
    updatedBy
  });
  return this.save();
};

// Virtual for formatted order date
orderSchema.virtual('formattedDate').get(function () {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ trackingNumber: 1 }, { sparse: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.id': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
// Dashboard aggregation indexes
orderSchema.index({ createdAt: -1, total: 1 });
orderSchema.index({ createdAt: -1, 'items.productId': 1 });
orderSchema.index({ createdAt: -1, status: 1, total: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
