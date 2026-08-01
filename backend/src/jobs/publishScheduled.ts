import cron from 'node-cron';
import { Post } from '../models/Post';
import { logger } from '../utils/logger';

export function startScheduledPublishJob(): void {
  // Runs every minute; publishes any post whose scheduledAt has arrived.
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const result = await Post.updateMany(
        { status: 'scheduled', scheduledAt: { $lte: now } },
        { $set: { status: 'published', publishedAt: now } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Scheduled publish job: published ${result.modifiedCount} post(s).`);
      }
    } catch (err) {
      logger.error(`Scheduled publish job failed: ${(err as Error).message}`);
    }
  });
}
