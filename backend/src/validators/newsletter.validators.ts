import { body } from 'express-validator';

export const subscribeValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];
