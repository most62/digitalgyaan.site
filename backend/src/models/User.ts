import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

export type UserRole = 'admin' | 'editor' | 'author' | 'user';

export interface IUser extends Document {
  name: string;
  slug: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  refreshTokens: string[];
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    role: {
      type: String,
      enum: ['admin', 'editor', 'author', 'user'],
      default: 'user',
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokens: { type: [String], select: false, default: [] },
    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    socialLinks: {
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      website: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

async function generateUniqueUserSlug(name: string, currentId?: unknown): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, trim: true }) || 'user';
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await User.findOne({ slug, _id: { $ne: currentId } }).lean();
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

userSchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = await generateUniqueUserSlug(this.name, this._id);
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp: number): boolean {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

export const User: Model<IUser> = model<IUser>('User', userSchema);
