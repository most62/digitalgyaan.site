import { body } from 'express-validator';

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 60 }),
  body('description').optional().trim().isLength({ max: 300 }),
  body('image').optional().trim(),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category'),
];

export const tagValidator = [
  body('name').trim().notEmpty().withMessage('Tag name is required').isLength({ max: 40 }),
];
