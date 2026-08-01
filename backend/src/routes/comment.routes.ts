import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { toggleLikeComment } from '../controllers/engagement.controller';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentValidator, updateCommentValidator } from '../validators/comment.validators';

// Nested under /api/v1/posts/:postId/comments
export const nestedCommentRouter = Router({ mergeParams: true });
nestedCommentRouter.get('/', commentController.getCommentsForPost);
nestedCommentRouter.post(
  '/',
  protect,
  createCommentValidator,
  validate,
  commentController.createComment
);

// Top-level: /api/v1/comments
export const commentRouter = Router();
commentRouter.get(
  '/pending',
  protect,
  restrictTo('admin', 'editor'),
  commentController.getPendingComments
);
commentRouter.patch(
  '/:id',
  protect,
  updateCommentValidator,
  validate,
  commentController.updateComment
);
commentRouter.delete('/:id', protect, commentController.deleteComment);
commentRouter.patch(
  '/:id/moderate',
  protect,
  restrictTo('admin', 'editor'),
  commentController.moderateComment
);
commentRouter.post('/:id/like', protect, toggleLikeComment);
