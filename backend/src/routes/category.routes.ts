import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categoryValidator } from '../validators/taxonomy.validators';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

router.use(protect, restrictTo('admin', 'editor'));
router.post('/', categoryValidator, validate, categoryController.createCategory);
router.patch('/:id', categoryValidator, validate, categoryController.updateCategory);
router.delete('/:id', restrictTo('admin'), categoryController.deleteCategory);

export default router;
