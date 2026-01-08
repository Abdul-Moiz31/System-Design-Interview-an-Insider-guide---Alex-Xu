import { Request, Response, NextFunction } from 'express';
import { UrlServiceError } from '../services/urlService.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof UrlServiceError) {
    const statusCode = {
      INVALID_URL: 400,
      NOT_FOUND: 404,
      EXPIRED: 410,
      GENERATION_FAILED: 503,
    }[err.code];

    res.status(statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

