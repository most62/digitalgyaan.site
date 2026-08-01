import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPostValidator, updatePostValidator } from '../validators/post.validators';

const router = Router();

// Public
router.get('/', postController.getPosts);
router.get('/trending', postController.getTrendingPosts);
router.get('/featured', postController.getFeaturedPosts);

// Authenticated (must come before the public "/:slug" catch-all)
router.get(
  '/admin',
  protect,
  restrictTo('admin', 'editor', 'author'),
  postController.getAdminPosts
);
router.get(
  '/admin/:id',
  protect,
  restrictTo('admin', 'editor', 'author'),
  postController.getPostForEdit
);
router.post(
  '/',
  protect,
  restrictTo('admin', 'editor', 'author'),
  createPostValidator,
  validate,
  postController.createPost
);
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'editor', 'author'),
  updatePostValidator,
  validate,
  postController.updatePost
);
router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'editor', 'author'),
  postController.deletePost
);

// Public single-post fetch by slug — kept last so it doesn't shadow the routes above.
router.get('/:slug', postController.getPostBySlug);

export default router;
