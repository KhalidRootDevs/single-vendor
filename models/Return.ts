import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReturnItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  reason: string;
}

export interface IReturn extends Document {
  returnNumber: string;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  items: IReturnItem[];
  reason:
    | 'defective'
    | 'wrong_item'
    | 'not_as_described'
    | 'changed_mind'
    | 'other';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  refundId?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const returnSchema = new Schema<IReturn>(
  {
    returnNumber: {
      type: String,
      unique: true,
      trim: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required']
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    items: {
      type: [returnItemSchema],
      required: true,
      validate: [
        (v: IReturnItem[]) => v.length > 0,
        'At least one item is required'
      ]
    },
    reason: {
      type: String,
      enum: [
        'defective',
        'wrong_item',
        'not_as_described',
        'changed_mind',
        'other'
      ],
      required: [true, 'Return reason is required']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'refunded'],
      default: 'pending'
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundId: { type: String, trim: true },
    adminNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

returnSchema.pre('save', function (next) {
  if (!this.returnNumber) {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.returnNumber = `RET-${y}${m}${d}-${rand}`;
  }
  next();
});

returnSchema.index({ orderId: 1 });
returnSchema.index({ userId: 1, createdAt: -1 });
returnSchema.index({ status: 1, createdAt: -1 });

export const Return: Model<IReturn> =
  mongoose.models.Return || mongoose.model<IReturn>('Return', returnSchema);
