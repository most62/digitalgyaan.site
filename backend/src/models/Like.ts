import { Schema, model, Document, Model, Types } from 'mongoose';

export type LikeTargetType = 'Post' | 'Comment';

export interface ILike extends Document {
  user: Types.ObjectId;
  targetType: LikeTargetType;
  targetId: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Post', 'Comment'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A user may like a given post/comment exactly once.
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Like: Model<ILike> = model<ILike>('Like', likeSchema);
