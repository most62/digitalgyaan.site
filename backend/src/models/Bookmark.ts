import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IBookmark extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

export const Bookmark: Model<IBookmark> = model<IBookmark>('Bookmark', bookmarkSchema);
