import { Router } from 'express';
import * as engagementController from '../controllers/engagement.controller';
import { protect, attachUserIfPresent } from '../middleware/auth';

const router = Router();

router.post('/:id/like', protect, engagementController.toggleLikePost);
router.post('/:id/bookmark', protect, engagementController.toggleBookmark);
router.get('/:id/engagement', protect, engagementController.getEngagementStatus);
// Views are tracked for guests too (attaches user if logged in, doesn't require it).
router.post('/:id/view', attachUserIfPresent, engagementController.recordView);

export default router;
