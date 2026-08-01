import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { verifyAccessToken } from '../utils/jwt';
import { User, UserRole } from '../models/User';

export const protect = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(new AppError('Invalid or expired session. Please log in again.', 401));
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!currentUser.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  if (currentUser.changedPasswordAfter(Math.floor(Date.now() / 1000))) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.user = currentUser;
  next();
});

// Attaches req.user if a valid token is present, but never blocks the request.
// Used on public routes that behave differently for logged-in users (e.g. like state).
export const attachUserIfPresent = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    try {
      const decoded = verifyAccessToken(authHeader.split(' ')[1]);
      const currentUser = await User.findById(decoded.id);
      if (currentUser?.isActive) {
        req.user = currentUser;
      }
    } catch {
      // Invalid/expired token on an optional-auth route: proceed as a guest.
    }
    next();
  }
);

export function restrictTo(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action.', 403));
      return;
    }
    next();
  };
}
