import { body, param } from 'express-validator';

export const createCommentValidator = [
  param('postId').isMongoId().withMessage('Invalid post id'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent comment id'),
];

export const updateCommentValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),
];
