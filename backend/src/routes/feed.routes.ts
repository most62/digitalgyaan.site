import { Router } from 'express';
import * as feedController from '../controllers/feed.controller';

const router = Router();

router.get('/sitemap.xml', feedController.getSitemap);
router.get('/robots.txt', feedController.getRobotsTxt);
router.get('/rss.xml', feedController.getRssFeed);

export default router;
