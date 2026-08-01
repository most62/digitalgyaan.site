import crypto from 'crypto';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { User, IUser } from '../models/User';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
} from '../utils/jwt';
import { sendEmail, passwordResetEmail } from '../utils/email';
import { env } from '../config/env';

function sanitizeUser(user: IUser) {
  return {
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

async function issueTokensAndRespond(
  res: Response,
  user: IUser,
  statusCode: number
): Promise<void> {
  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5); // cap stored sessions
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());

  res.status(statusCode).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken,
    },
  });
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({ name, email, password, role: 'user' });
  await issueTokensAndRespond(res, user, 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  await issueTokensAndRespond(res, user, 200);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.signedCookies?.refreshToken;
  if (!token) {
    throw new AppError('No refresh token provided.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    throw new AppError('Refresh token is no longer valid. Please log in again.', 401);
  }

  // Rotate: invalidate the used refresh token, issue a brand new pair.
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  await issueTokensAndRespond(res, user, 200);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.signedCookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: sanitizeUser(req.user as IUser) });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return a generic success message to avoid leaking which emails are registered.
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;
  const { subject, html, text } = passwordResetEmail(resetUrl);

  try {
    await sendEmail({ to: user.email, subject, html, text });
    res.status(200).json(genericResponse);
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('There was an error sending the reset email. Please try again later.', 500);
  }
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+refreshTokens');

  if (!user) {
    throw new AppError('Token is invalid or has expired.', 400);
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // force re-login on all devices after a password reset
  await user.save();

  await issueTokensAndRespond(res, user, 200);
});

export const updatePassword = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById((req.user as IUser).id).select('+password +refreshTokens');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const { currentPassword, newPassword } = req.body;
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  await issueTokensAndRespond(res, user, 200);
});
