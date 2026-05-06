import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId?: string;
  link: string;
  buttonText: string;
  active: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    imageUrl: {
      type: String,
      required: [true, 'Image is required'],
      trim: true
    },
    imagePublicId: {
      type: String,
      trim: true
    },
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true
    },
    buttonText: {
      type: String,
      required: [true, 'Button text is required'],
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  { timestamps: true }
);

bannerSchema.index({ active: 1, order: 1 });
bannerSchema.index({ createdAt: -1 });

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>('Banner', bannerSchema);
