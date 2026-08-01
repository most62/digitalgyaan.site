import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { protect, restrictTo } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect, restrictTo('admin', 'editor', 'author'));

router.post('/image', upload.single('image'), uploadController.uploadSingleImage);
router.post('/images', upload.array('images', 10), uploadController.uploadMultipleImages);
router.delete('/image', uploadController.deleteImage);

export default router;
