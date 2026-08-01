import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IView extends Document {
  post: Types.ObjectId;
  viewer: string; // authenticated user id, or a hashed IP+UA fingerprint for guests
  user?: Types.ObjectId;
  dateBucket: string; // YYYY-MM-DD, used to dedupe repeat views within a day
  createdAt: Date;
}

const viewSchema = new Schema<IView>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    viewer: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    dateBucket: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One counted view per viewer per post per day.
viewSchema.index({ post: 1, viewer: 1, dateBucket: 1 }, { unique: true });
viewSchema.index({ post: 1, createdAt: -1 });

// Raw view logs older than 180 days are pruned automatically; Post.viewsCount
// (the cached counter used for display/trending) is unaffected.
viewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const View: Model<IView> = model<IView>('View', viewSchema);
