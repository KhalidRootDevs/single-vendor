import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IServerCartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    sku?: string;
    attributes: Record<string, string>;
  };
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: IServerCartItem[];
  reminderSentAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const serverCartItemSchema = new Schema<IServerCartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    variant: {
      sku: { type: String },
      attributes: { type: Schema.Types.Mixed, default: {} }
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: { type: [serverCartItemSchema], default: [] },
    reminderSentAt: { type: Date }
  },
  { timestamps: true }
);

// Auto-delete carts not updated in 30 days
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
cartSchema.index({ userId: 1 }, { unique: true });

export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
