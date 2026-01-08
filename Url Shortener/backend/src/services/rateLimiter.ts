import { redis, cacheKeys } from '../cache/redis.js';
import { config } from '../config/index.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Token bucket rate limiter using Redis
 * Each IP gets a fixed number of requests per time window
 */
export const rateLimiter = {
  /**
   * Check if request is allowed and consume a token
   */
  async checkLimit(ip: string): Promise<RateLimitResult> {
    const key = cacheKeys.rateLimit(ip);
    const { windowSeconds, maxRequests } = config.rateLimit;
    
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
    const resetAt = (windowStart + windowSeconds) * 1000;
    
    // Use sliding window counter
    const currentCount = await redis.incr(key);
    
    // Set expiry on first request
    if (currentCount === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const remaining = Math.max(0, maxRequests - currentCount);
    const allowed = currentCount <= maxRequests;
    
    return {
      allowed,
      remaining,
      resetAt,
    };
  },

  /**
   * Get current rate limit status without consuming a token
   */
  async getStatus(ip: string): Promise<RateLimitResult> {
    const key = cacheKeys.rateLimit(ip);
    const { windowSeconds, maxRequests } = config.rateLimit;
    
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
    const resetAt = (windowStart + windowSeconds) * 1000;
    
    const currentCountStr = await redis.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    const remaining = Math.max(0, maxRequests - currentCount);
    
    return {
      allowed: currentCount < maxRequests,
      remaining,
      resetAt,
    };
  },
};

