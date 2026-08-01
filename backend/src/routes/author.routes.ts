import { Router } from 'express';
import { getAuthorBySlug } from '../controllers/author.controller';

const router = Router();

router.get('/:slug', getAuthorBySlug);

export default router;
