import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { User } from '../models/User';
import { Post } from '../models/Post';

// GET /authors/:slug — public author profile. Only admin/editor/author roles
// are exposed publicly; plain "user" accounts (commenters) have no public page.
export const getAuthorBySlug = catchAsync(async (req: Request, res: Response) => {
  const author = await User.findOne({
    slug: req.params.slug,
    isActive: true,
    role: { $in: ['admin', 'editor', 'author'] },
  }).select('name slug avatar bio role socialLinks createdAt');

  if (!author) {
    throw new AppError('Author not found.', 404);
  }

  const postsCount = await Post.countDocuments({ author: author._id, status: 'published' });

  res.status(200).json({ success: true, data: { author, postsCount } });
});
