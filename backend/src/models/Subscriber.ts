import { Schema, model, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  isConfirmed: boolean;
  confirmToken?: string;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    isConfirmed: { type: Boolean, default: false },
    confirmToken: { type: String, select: false },
    unsubscribeToken: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const Subscriber: Model<ISubscriber> = model<ISubscriber>('Subscriber', subscriberSchema);
