import { body, param } from 'express-validator';

export const createPostValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 180 }),
  body('excerpt').trim().notEmpty().withMessage('Excerpt is required').isLength({ max: 300 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('featuredImage').trim().notEmpty().withMessage('Featured image is required'),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isMongoId().withMessage('Each tag must be a valid id'),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid date'),
  body('faqs').optional().isArray(),
  body('faqs.*.question').optional().isString().isLength({ max: 300 }),
  body('faqs.*.answer').optional().isString().isLength({ max: 2000 }),
];

export const updatePostValidator = [
  body('title').optional().trim().isLength({ max: 180 }),
  body('excerpt').optional().trim().isLength({ max: 300 }),
  body('content').optional().trim().notEmpty(),
  body('category').optional().isMongoId().withMessage('A valid category is required'),
  body('tags').optional().isArray(),
  body('tags.*').optional().isMongoId(),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('scheduledAt').optional().isISO8601(),
];

export const postIdOrSlugValidator = [param('idOrSlug').notEmpty().withMessage('Identifier is required')];
