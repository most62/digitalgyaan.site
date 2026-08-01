import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IComment extends Document {
  post: Types.ObjectId;
  author: Types.ObjectId;
  parent: Types.ObjectId | null;
  content: string;
  likesCount: number;
  isApproved: boolean;
  isSpam: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    likesCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
    isSpam: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, parent: 1, createdAt: -1 });
commentSchema.index({ isApproved: 1, isSpam: 1 });

export const Comment: Model<IComment> = model<IComment>('Comment', commentSchema);
