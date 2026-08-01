import crypto from 'crypto';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Like } from '../models/Like';
import { Bookmark } from '../models/Bookmark';
import { View } from '../models/View';
import { IUser } from '../models/User';
import { withTransaction } from '../utils/transaction';

// GET /posts/:id/engagement — the current user's like/bookmark state for a post.
export const getEngagementStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUser)._id;
  const postId = req.params.id;

  const [liked, bookmarked] = await Promise.all([
    Like.exists({ user: userId, targetType: 'Post', targetId: postId }),
    Bookmark.exists({ user: userId, post: postId }),
  ]);

  res.status(200).json({ success: true, data: { liked: !!liked, bookmarked: !!bookmarked } });
});

// POST /posts/:id/like — toggle. Returns the new liked state and count.
export const toggleLikePost = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);

  const userId = (req.user as IUser)._id;

  const result = await withTransaction(async (session) => {
    const existing = await Like.findOne({
      user: userId,
      targetType: 'Post',
      targetId: post._id,
    }).session(session);

    if (existing) {
      await existing.deleteOne({ session });
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save({ session, validateBeforeSave: false });
      return { liked: false, likesCount: post.likesCount };
    }

    await Like.create([{ user: userId, targetType: 'Post', targetId: post._id }], { session });
    post.likesCount += 1;
    await post.save({ session, validateBeforeSave: false });
    return { liked: true, likesCount: post.likesCount };
  });

  res.status(200).json({ success: true, data: result });
});

// POST /comments/:id/like — toggle like on a comment.
export const toggleLikeComment = catchAsync(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found.', 404);

  const userId = (req.user as IUser)._id;

  const result = await withTransaction(async (session) => {
    const existing = await Like.findOne({
      user: userId,
      targetType: 'Comment',
      targetId: comment._id,
    }).session(session);

    if (existing) {
      await existing.deleteOne({ session });
      comment.likesCount = Math.max(0, comment.likesCount - 1);
      await comment.save({ session, validateBeforeSave: false });
      return { liked: false, likesCount: comment.likesCount };
    }

    await Like.create([{ user: userId, targetType: 'Comment', targetId: comment._id }], {
      session,
    });
    comment.likesCount += 1;
    await comment.save({ session, validateBeforeSave: false });
    return { liked: true, likesCount: comment.likesCount };
  });

  res.status(200).json({ success: true, data: result });
});

// POST /posts/:id/bookmark — toggle.
export const toggleBookmark = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id).select('_id');
  if (!post) throw new AppError('Post not found.', 404);

  const userId = (req.user as IUser)._id;
  const existing = await Bookmark.findOne({ user: userId, post: post._id });

  if (existing) {
    await existing.deleteOne();
    res.status(200).json({ success: true, data: { bookmarked: false } });
    return;
  }

  await Bookmark.create({ user: userId, post: post._id });
  res.status(200).json({ success: true, data: { bookmarked: true } });
});

// GET /me/bookmarks — the current user's saved posts.
export const getMyBookmarks = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUser)._id;
  const bookmarks = await Bookmark.find({ user: userId })
    .sort('-createdAt')
    .populate({
      path: 'post',
      select: 'title slug excerpt featuredImage readingTime publishedAt status',
      populate: { path: 'category', select: 'name slug' },
    });

  res.status(200).json({
    success: true,
    data: bookmarks.map((b) => b.post).filter((p) => p !== null),
  });
});

// POST /posts/:id/view — records a deduplicated view (one per viewer per day) and
// increments the cached counter used for display and trending sort.
export const recordView = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id).select('_id viewsCount');
  if (!post) throw new AppError('Post not found.', 404);

  const user = req.user as IUser | undefined;
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const viewer = user
    ? String(user._id)
    : crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');

  const dateBucket = new Date().toISOString().slice(0, 10);

  try {
    await View.create({ post: post._id, viewer, user: user?._id, dateBucket });
    post.viewsCount += 1;
    await post.save({ validateBeforeSave: false });
  } catch (err) {
    // Duplicate key (viewer already counted today) is expected and not an error.
    const isDuplicate = (err as { code?: number }).code === 11000;
    if (!isDuplicate) throw err;
  }

  res.status(200).json({ success: true, data: { viewsCount: post.viewsCount } });
});
