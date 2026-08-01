import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
}

function handleCastError(err: MongoServerError): AppError {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

function handleDuplicateFieldsError(err: MongoServerError): AppError {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  return new AppError(`Duplicate value for "${field}". Please use another value.`, 400);
}

function handleValidationError(err: MongoServerError): AppError {
  const messages = err.errors ? Object.values(err.errors).map((e) => e.message) : [];
  return new AppError(`Invalid input data: ${messages.join('. ')}`, 400);
}

function handleJWTError(): AppError {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError(): AppError {
  return new AppError('Your session has expired. Please log in again.', 401);
}

export function globalErrorHandler(
  err: MongoServerError & Partial<AppError>,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else {
    error = new AppError(err.message || 'Something went wrong', 500);
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.stack || err.message}`);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status || 'error',
    message: error.isOperational ? error.message : 'Something went wrong on our end',
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    status: 'fail',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
