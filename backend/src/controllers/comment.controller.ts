import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Comment, IComment } from '../models/Comment';
import { Post } from '../models/Post';
import { Settings } from '../models/Settings';
import { IUser } from '../models/User';
import { withTransaction } from '../utils/transaction';

interface CommentNode {
  _id: Types.ObjectId;
  content: string;
  author: unknown;
  parent: Types.ObjectId | null;
  likesCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies: CommentNode[];
}

function buildCommentTree(comments: IComment[]): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((c) => {
    nodeMap.set(String(c._id), {
      _id: c._id as Types.ObjectId,
      content: c.content,
      author: c.author,
      parent: c.parent,
      likesCount: c.likesCount,
      isEdited: c.isEdited,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      replies: [],
    });
  });

  comments.forEach((c) => {
    const node = nodeMap.get(String(c._id))!;
    if (c.parent) {
      const parentNode = nodeMap.get(String(c.parent));
      if (parentNode) {
        parentNode.replies.push(node);
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

// GET /posts/:postId/comments — public, approved-only nested comment tree.
export const getCommentsForPost = catchAsync(async (req: Request, res: Response) => {
  const comments = await Comment.find({
    post: req.params.postId,
    isApproved: true,
    isSpam: false,
  })
    .sort('createdAt')
    .populate({ path: 'author', select: 'name avatar' });

  res.status(200).json({ success: true, data: buildCommentTree(comments) });
});

// POST /posts/:postId/comments — create a top-level comment or a reply.
export const createComment = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.postId).select('_id status commentsCount');
  if (!post || post.status !== 'published') {
    throw new AppError('Post not found.', 404);
  }

  const { content, parent } = req.body;

  if (parent) {
    const parentComment = await Comment.findById(parent);
    if (!parentComment || String(parentComment.post) !== String(post._id)) {
      throw new AppError('Invalid parent comment.', 400);
    }
  }

  const settings = await Settings.findOne({ singleton: 'main' });
  const requiresApproval = settings?.commentsRequireApproval ?? false;

  const comment = await withTransaction(async (session) => {
    const [created] = await Comment.create(
      [
        {
          post: post._id,
          author: (req.user as IUser)._id,
          parent: parent || null,
          content,
          isApproved: !requiresApproval,
        },
      ],
      { session }
    );

    if (!requiresApproval) {
      post.commentsCount += 1;
      await post.save({ session, validateBeforeSave: false });
    }

    return created;
  });

  await comment.populate({ path: 'author', select: 'name avatar' });
  res.status(201).json({ success: true, data: comment });
});

// PATCH /comments/:id — author-only edit.
export const updateComment = catchAsync(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found.', 404);

  const currentUser = req.user as IUser;
  if (String(comment.author) !== String(currentUser._id)) {
    throw new AppError('You can only edit your own comments.', 403);
  }

  comment.content = req.body.content;
  comment.isEdited = true;
  await comment.save();

  res.status(200).json({ success: true, data: comment });
});

// DELETE /comments/:id — author or admin. Hard-deletes leaf comments; comments with
// existing replies are soft-deleted (content replaced) to keep the reply thread intact.
export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found.', 404);

  const currentUser = req.user as IUser;
  const isOwner = String(comment.author) === String(currentUser._id);
  if (!isOwner && !['admin', 'editor'].includes(currentUser.role)) {
    throw new AppError('You do not have permission to delete this comment.', 403);
  }

  const hasReplies = await Comment.exists({ parent: comment._id });

  await withTransaction(async (session) => {
    if (hasReplies) {
      comment.content = '[deleted]';
      comment.isEdited = true;
      await comment.save({ session });
    } else {
      await comment.deleteOne({ session });
    }

    if (comment.isApproved) {
      await Post.findByIdAndUpdate(
        comment.post,
        { $inc: { commentsCount: -1 } },
        { session }
      );
    }
  });

  res.status(204).send();
});

// GET /comments/pending — admin/editor moderation queue.
export const getPendingComments = catchAsync(async (_req: Request, res: Response) => {
  const comments = await Comment.find({ isApproved: false, isSpam: false })
    .sort('-createdAt')
    .populate([
      { path: 'author', select: 'name avatar email' },
      { path: 'post', select: 'title slug' },
    ]);

  res.status(200).json({ success: true, data: comments });
});

// PATCH /comments/:id/moderate — admin/editor approves or flags a comment as spam.
export const moderateComment = catchAsync(async (req: Request, res: Response) => {
  const { action } = req.body as { action: 'approve' | 'spam' };
  if (!['approve', 'spam'].includes(action)) {
    throw new AppError('Action must be "approve" or "spam".', 400);
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found.', 404);

  await withTransaction(async (session) => {
    if (action === 'approve' && !comment.isApproved) {
      comment.isApproved = true;
      comment.isSpam = false;
      await comment.save({ session });
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: 1 } }, { session });
    } else if (action === 'spam') {
      const wasApproved = comment.isApproved;
      comment.isSpam = true;
      comment.isApproved = false;
      await comment.save({ session });
      if (wasApproved) {
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } }, { session });
      }
    }
  });

  res.status(200).json({ success: true, data: comment });
});
