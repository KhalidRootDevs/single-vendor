import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [32, 'Code cannot exceed 32 characters']
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: [true, 'Discount type is required']
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Value must be positive']
    },
    minSubtotal: {
      type: Number,
      default: 0,
      min: [0, 'Min subtotal must be positive']
    },
    maxUses: {
      type: Number,
      default: 0 // 0 = unlimited
    },
    usedCount: {
      type: Number,
      default: 0
    },
    perUserLimit: {
      type: Number,
      default: 0 // 0 = unlimited
    },
    active: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, expiresAt: 1 });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);
