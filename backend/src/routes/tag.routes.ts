import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tagValidator } from '../validators/taxonomy.validators';

const router = Router();

router.get('/', tagController.getTags);
router.get('/:slug', tagController.getTagBySlug);

router.use(protect, restrictTo('admin', 'editor'));
router.post('/', tagValidator, validate, tagController.createTag);
router.patch('/:id', tagValidator, validate, tagController.updateTag);
router.delete('/:id', restrictTo('admin'), tagController.deleteTag);

export default router;
