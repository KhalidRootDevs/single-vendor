import mongoose, { Document, Model, Schema } from 'mongoose';

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new'
    }
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

export const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>('Contact', contactSchema);
