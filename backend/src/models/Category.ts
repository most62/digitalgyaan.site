import { Schema, model, Document, Model, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | null;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, maxlength: 300, default: '' },
    image: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    seo: {
      metaTitle: { type: String, maxlength: 70, default: '' },
      metaDescription: { type: String, maxlength: 160, default: '' },
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });

export const Category: Model<ICategory> = model<ICategory>('Category', categorySchema);
