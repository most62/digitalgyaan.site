import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as newsletterController from '../controllers/newsletter.controller';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { subscribeValidator } from '../validators/newsletter.validators';

const router = Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many subscription attempts. Please try again later.' },
});

router.post('/subscribe', subscribeLimiter, subscribeValidator, validate, newsletterController.subscribe);
router.get('/confirm/:token', newsletterController.confirmSubscription);
router.get('/unsubscribe/:token', newsletterController.unsubscribe);
router.get('/subscribers', protect, restrictTo('admin', 'editor'), newsletterController.getSubscribers);

export default router;
