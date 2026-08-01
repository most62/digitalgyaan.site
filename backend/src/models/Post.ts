import { Schema, model, Document, Model, Types } from 'mongoose';
import slugify from 'slugify';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface ITocEntry {
  id: string;
  text: string;
  level: number;
}

export interface IFaqEntry {
  question: string;
  answer: string;
}

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  gallery: string[];
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  author: Types.ObjectId;
  status: PostStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  readingTime: number;
  tableOfContents: ITocEntry[];
  faqs: IFaqEntry[];
  isFeatured: boolean;
  isTrending: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    ogImage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tocEntrySchema = new Schema<ITocEntry>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    level: { type: Number, required: true, min: 1, max: 6 },
  },
  { _id: false }
);

const faqEntrySchema = new Schema<IFaqEntry>(
  {
    question: { type: String, required: true, maxlength: 300 },
    answer: { type: String, required: true, maxlength: 2000 },
  },
  { _id: false }
);

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: 300,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    featuredImage: {
      type: String,
      required: [true, 'Featured image is required'],
    },
    gallery: { type: [String], default: [] },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    readingTime: { type: Number, default: 1 },
    tableOfContents: { type: [tocEntrySchema], default: [] },
    faqs: { type: [faqEntrySchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    seo: {
      metaTitle: { type: String, maxlength: 70, default: '' },
      metaDescription: { type: String, maxlength: 160, default: '' },
      canonicalUrl: { type: String, default: '' },
      ogImage: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Compound + single-field indexes tuned for the actual query patterns:
// listing by status+publishedAt, filtering by category/tag, full-text search.
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ status: 1, viewsCount: -1 });
postSchema.index({ status: 1, likesCount: -1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1 });
postSchema.index({ tags: 1, status: 1, publishedAt: -1 });
postSchema.index({ isFeatured: 1, status: 1 });
postSchema.index({ isTrending: 1, status: 1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

function calculateReadingTime(html: string): number {
  const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function generateUniqueSlug(title: string, currentId?: Types.ObjectId): Promise<string> {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Post.findOne({ slug, _id: { $ne: currentId } }).lean();
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

postSchema.pre('validate', async function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = await generateUniqueSlug(this.title, this._id as Types.ObjectId);
  }
  next();
});

postSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.readingTime = calculateReadingTime(this.content);
  }
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.slice(0, 70);
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.slice(0, 160);
  }
  next();
});

export const Post: Model<IPost> = model<IPost>('Post', postSchema);
