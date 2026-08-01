import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startScheduledPublishJob } from './jobs/publishScheduled';

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Digital Gyaan API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  startScheduledPublishJob();

  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
}

bootstrap();
