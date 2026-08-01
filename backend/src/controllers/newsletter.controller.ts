import crypto from 'crypto';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Subscriber } from '../models/Subscriber';
import { sendEmail, newsletterConfirmEmail } from '../utils/email';
import { env } from '../config/env';
import { ApiFeatures, buildPaginationMeta } from '../utils/apiFeatures';

export const subscribe = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const existing = await Subscriber.findOne({ email });
  if (existing?.isConfirmed) {
    res.status(200).json({ success: true, message: 'You are already subscribed.' });
    return;
  }

  const confirmToken = crypto.randomBytes(32).toString('hex');
  const unsubscribeToken = crypto.randomBytes(32).toString('hex');

  const subscriber =
    existing ||
    new Subscriber({
      email,
      unsubscribeToken,
    });

  subscriber.confirmToken = confirmToken;
  await subscriber.save();

  const confirmUrl = `${env.apiUrl}/api/v1/newsletter/confirm/${confirmToken}`;
  const { subject, html, text } = newsletterConfirmEmail(confirmUrl);

  await sendEmail({ to: email, subject, html, text });

  res.status(200).json({
    success: true,
    message: 'Check your inbox to confirm your subscription.',
  });
});

export const confirmSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscriber = await Subscriber.findOne({ confirmToken: req.params.token }).select(
    '+confirmToken'
  );
  if (!subscriber) {
    throw new AppError('Invalid or expired confirmation link.', 400);
  }

  subscriber.isConfirmed = true;
  subscriber.confirmToken = undefined;
  await subscriber.save();

  res.redirect(`${env.clientUrl}/newsletter/confirmed`);
});

export const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const subscriber = await Subscriber.findOne({ unsubscribeToken: req.params.token }).select(
    '+unsubscribeToken'
  );
  if (!subscriber) {
    throw new AppError('Invalid unsubscribe link.', 400);
  }

  await subscriber.deleteOne();
  res.redirect(`${env.clientUrl}/newsletter/unsubscribed`);
});

export const getSubscribers = catchAsync(async (req: Request, res: Response) => {
  const filter = { isConfirmed: true };
  const totalResults = await Subscriber.countDocuments(filter);

  const features = new ApiFeatures(Subscriber.find(filter), req.query as Record<string, unknown>)
    .sort('-createdAt')
    .paginate();

  const subscribers = await features.query;
  const { page, limit } = features.getPaginationState();
  const meta = await buildPaginationMeta(totalResults, page, limit);

  res.status(200).json({ success: true, data: subscribers, meta });
});
