import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../services/rateLimiter.js';

/**
 * Rate limiting middleware for URL creation endpoints
 */
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const result = await rateLimiter.checkLimit(ip);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
      return;
    }
    
    next();
  } catch (error) {
    // If rate limiter fails, allow request (fail-open)
    console.error('Rate limiter error:', error);
    next();
  }
}

