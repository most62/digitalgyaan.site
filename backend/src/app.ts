import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import categoryRouter from './routes/category.routes';
import tagRouter from './routes/tag.routes';
import postRouter from './routes/post.routes';
import engagementRouter from './routes/engagement.routes';
import meRouter from './routes/me.routes';
import { nestedCommentRouter, commentRouter } from './routes/comment.routes';
import newsletterRouter from './routes/newsletter.routes';
import uploadRouter from './routes/upload.routes';
import feedRouter from './routes/feed.routes';
import authorRouter from './routes/author.routes';
// Phase 6 will mount: users/admin management, analytics, settings

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // --- Security headers ---
  app.use(helmet());

  // --- CORS (frontend origin only, credentials for cookie-based refresh tokens) ---
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // --- Body / cookie parsing ---
  // 2mb accommodates long rich-text article bodies; actual images are uploaded
  // separately via multipart/Cloudinary (see uploadRouter), never as JSON.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(env.cookieSecret));

  // --- Sanitization against NoSQL injection & XSS ---
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());

  // --- Compression & logging ---
  app.use(compression());
  if (!env.isProd) {
    app.use(morgan('dev'));
  }

  // --- Global rate limiting (tighter limits applied per-route later, e.g. auth) ---
  app.use(
    '/api',
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    })
  );

  // --- Routes ---
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/categories', categoryRouter);
  app.use('/api/v1/tags', tagRouter);
  app.use('/api/v1/posts/:postId/comments', nestedCommentRouter);
  app.use('/api/v1/posts', engagementRouter);
  app.use('/api/v1/posts', postRouter);
  app.use('/api/v1/comments', commentRouter);
  app.use('/api/v1/me', meRouter);
  app.use('/api/v1/newsletter', newsletterRouter);
  app.use('/api/v1/uploads', uploadRouter);
  app.use('/api/v1/authors', authorRouter);

  // Feed routes are served at the domain root (conventional location for
  // sitemap.xml / robots.txt / rss.xml), outside the /api rate limiter above.
  app.use('/', feedRouter);

  // --- 404 + error handling ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
