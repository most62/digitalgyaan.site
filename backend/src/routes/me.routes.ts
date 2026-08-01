import { Router } from 'express';
import { getMyBookmarks } from '../controllers/engagement.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/bookmarks', protect, getMyBookmarks);

export default router;
