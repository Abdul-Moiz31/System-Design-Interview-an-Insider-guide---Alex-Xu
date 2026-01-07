/**
 * =============================================================================
 * RATE LIMITER MIDDLEWARE FOR EXPRESS.JS
 * =============================================================================
 * 
 * 📚 WHAT IS THIS?
 * 
 * This is an Express middleware that intercepts ALL incoming requests and
 * decides whether to allow or reject them based on rate limiting rules.
 * 
 * 🎯 WHERE DOES IT FIT IN THE REQUEST FLOW?
 * 
 * Client Request
 *       │
 *       ▼
 *   ┌─────────────────┐
 *   │  Load Balancer  │
 *   └────────┬────────┘
 *            │
 *            ▼
 *   ┌─────────────────┐
 *   │   API Gateway   │  ← Could be here (managed service)
 *   └────────┬────────┘
 *            │
 *            ▼
 *   ┌─────────────────┐
 *   │ RATE LIMITER ★  │  ← OR here (our middleware)
 *   └────────┬────────┘
 *            │
 *      ┌─────┴─────┐
 *      │ Allowed?  │
 *      └─────┬─────┘
 *        │      │
 *      YES     NO
 *        │      │
 *        ▼      ▼
 *   ┌─────┐   ┌─────┐
 *   │ API │   │ 429 │
 *   │ ✓   │   │ ✗   │
 *   └─────┘   └─────┘
 * 
 * 🆚 WHY MIDDLEWARE OVER OTHER OPTIONS?
 * 
 * 1. API GATEWAY (e.g., AWS API Gateway, Kong):
 *    - ✅ Managed, less code to maintain
 *    - ❌ Less control, costs money, vendor lock-in
 * 
 * 2. MIDDLEWARE (this approach):
 *    - ✅ Full control over algorithm and rules
 *    - ✅ Can customize for specific endpoints
 *    - ❌ More code to maintain
 *    - ❌ Need to handle distributed state yourself
 * 
 * 3. WITHIN EACH ROUTE HANDLER:
 *    - ❌ Code duplication
 *    - ❌ Easy to forget
 *    - ❌ Hard to maintain
 */

import { Request, Response, NextFunction } from 'express';
import { 
  RateLimitConfig, 
  RateLimitResult, 
  RateLimitStore, 
  RateLimitAlgorithm,
  RateLimiterStats 
} from '../types';
import {
  TokenBucketRateLimiter,
  LeakingBucketRateLimiter,
  FixedWindowRateLimiter,
  SlidingWindowLogRateLimiter,
  SlidingWindowCounterRateLimiter
} from '../algorithms';

// Type for the rate limiter classes
type RateLimiterClass = 
  | TokenBucketRateLimiter 
  | LeakingBucketRateLimiter 
  | FixedWindowRateLimiter 
  | SlidingWindowLogRateLimiter 
  | SlidingWindowCounterRateLimiter;

/**
 * Statistics tracking for monitoring
 */
const stats: RateLimiterStats = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  uniqueKeys: new Set<string>().size,
  requestsByAlgorithm: {
    TOKEN_BUCKET: { total: 0, allowed: 0, blocked: 0 },
    LEAKING_BUCKET: { total: 0, allowed: 0, blocked: 0 },
    FIXED_WINDOW: { total: 0, allowed: 0, blocked: 0 },
    SLIDING_WINDOW_LOG: { total: 0, allowed: 0, blocked: 0 },
    SLIDING_WINDOW_COUNTER: { total: 0, allowed: 0, blocked: 0 }
  }
};

// Track unique keys (for stats)
const uniqueKeys = new Set<string>();

/**
 * Create a rate limiter instance based on the algorithm type
 * 
 * WHY FACTORY PATTERN?
 * - Single point to create rate limiters
 * - Easy to add new algorithms
 * - Centralizes configuration
 */
function createRateLimiter(
  algorithm: RateLimitAlgorithm,
  store: RateLimitStore,
  config: RateLimitConfig
): RateLimiterClass {
  switch (algorithm) {
    case 'TOKEN_BUCKET':
      return new TokenBucketRateLimiter(store, config);
    
    case 'LEAKING_BUCKET':
      return new LeakingBucketRateLimiter(store, config);
    
    case 'FIXED_WINDOW':
      return new FixedWindowRateLimiter(store, config);
    
    case 'SLIDING_WINDOW_LOG':
      return new SlidingWindowLogRateLimiter(store, config);
    
    case 'SLIDING_WINDOW_COUNTER':
      return new SlidingWindowCounterRateLimiter(store, config);
    
    default:
      // TypeScript ensures this is exhaustive, but just in case:
      throw new Error(`Unknown rate limit algorithm: ${algorithm}`);
  }
}

/**
 * Default key generator - extracts client identifier from request
 * 
 * WHY THIS ORDER?
 * 1. X-Forwarded-For: When behind a proxy/load balancer
 * 2. req.ip: Express's best guess at client IP
 * 3. Connection IP: Fallback
 * 4. 'unknown': Last resort (should never happen)
 * 
 * SECURITY NOTE:
 * X-Forwarded-For can be spoofed! In production:
 * - Trust only the leftmost IP if your proxy sets it
 * - Or configure Express to trust specific proxies
 */
function defaultKeyGenerator(req: Request): string {
  // Check for forwarded IP (behind proxy)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Could be comma-separated list, take the first one
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  // Express's req.ip (respects trust proxy settings)
  if (req.ip) {
    return req.ip;
  }

  // Direct connection IP
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}

/**
 * Set rate limit headers on the response
 * 
 * WHY THESE HEADERS?
 * These are draft-standard headers that many APIs use:
 * - X-RateLimit-Limit: Total allowed requests
 * - X-RateLimit-Remaining: Requests left in window
 * - X-RateLimit-Reset: When the window resets (Unix timestamp)
 * - Retry-After: Standard HTTP header for 429 responses
 */
function setRateLimitHeaders(res: Response, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetTime);
  
  if (result.retryAfter !== undefined) {
    res.setHeader('Retry-After', result.retryAfter);
  }
}

/**
 * Create a rate limiter middleware
 * 
 * @param store - The storage backend (MemoryStore or RedisStore)
 * @param config - Rate limiting configuration
 * @returns Express middleware function
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const limiter = createRateLimiterMiddleware(new MemoryStore(), {
 *   windowMs: 60000,        // 1 minute
 *   maxRequests: 100,       // 100 requests per minute
 *   algorithm: 'TOKEN_BUCKET'
 * });
 * 
 * app.use('/api', limiter);
 * ```
 */
export function createRateLimiterMiddleware(
  store: RateLimitStore,
  config: RateLimitConfig
) {
  // Create the rate limiter instance
  const rateLimiter = createRateLimiter(config.algorithm, store, config);
  
  // Get the key generator (custom or default)
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Generate the unique key for this client
      const key = keyGenerator(req);
      
      // Step 2: Track unique keys for stats
      uniqueKeys.add(key);
      
      // Step 3: Check if this request should be allowed
      const result = await rateLimiter.checkLimit(key);
      
      // Step 4: Update statistics
      stats.totalRequests++;
      stats.uniqueKeys = uniqueKeys.size;
      stats.requestsByAlgorithm[config.algorithm].total++;
      
      if (result.allowed) {
        stats.allowedRequests++;
        stats.requestsByAlgorithm[config.algorithm].allowed++;
      } else {
        stats.blockedRequests++;
        stats.requestsByAlgorithm[config.algorithm].blocked++;
      }
      
      // Step 5: Set rate limit headers (if configured)
      if (config.headers !== false) {
        setRateLimitHeaders(res, result);
      }
      
      // Step 6: If not allowed, send 429 response
      if (!result.allowed) {
        const statusCode = config.statusCode || 429;
        const message = config.message || 'Too Many Requests';
        
        res.status(statusCode).json({
          error: message,
          retryAfter: result.retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime * 1000).toISOString()
        });
        return;
      }
      
      // Step 7: Request allowed, continue to next middleware/route
      next();
      
    } catch (error) {
      // Error handling - fail open or closed?
      // 
      // FAIL OPEN: Allow request if rate limiter fails
      // - Pros: Better user experience, system stays available
      // - Cons: No protection during failure
      //
      // FAIL CLOSED: Block request if rate limiter fails
      // - Pros: Maintains protection
      // - Cons: Could block legitimate traffic
      //
      // We choose FAIL OPEN as it's more user-friendly
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Get current rate limiter statistics
 */
export function getStats(): RateLimiterStats {
  return { ...stats };
}

/**
 * Reset statistics (for testing)
 */
export function resetStats(): void {
  stats.totalRequests = 0;
  stats.allowedRequests = 0;
  stats.blockedRequests = 0;
  stats.uniqueKeys = 0;
  uniqueKeys.clear();
  
  for (const algo of Object.keys(stats.requestsByAlgorithm) as RateLimitAlgorithm[]) {
    stats.requestsByAlgorithm[algo] = { total: 0, allowed: 0, blocked: 0 };
  }
}

/**
 * =============================================================================
 * MIDDLEWARE FLOW DIAGRAM
 * =============================================================================
 * 
 * Request → createRateLimiterMiddleware()
 *                    │
 *                    ▼
 *            ┌───────────────┐
 *            │ Extract Key   │  (IP, User ID, API Key)
 *            │ from Request  │
 *            └───────┬───────┘
 *                    │
 *                    ▼
 *            ┌───────────────┐
 *            │ Rate Limiter  │  (Token Bucket, Sliding Window, etc.)
 *            │ .checkLimit() │
 *            └───────┬───────┘
 *                    │
 *            ┌───────┴───────┐
 *            │               │
 *            ▼               ▼
 *      ┌─────────┐     ┌─────────┐
 *      │ ALLOWED │     │ BLOCKED │
 *      └────┬────┘     └────┬────┘
 *           │               │
 *           ▼               ▼
 *      ┌─────────┐     ┌─────────┐
 *      │ Set     │     │ Set     │
 *      │ Headers │     │ Headers │
 *      └────┬────┘     └────┬────┘
 *           │               │
 *           ▼               ▼
 *      ┌─────────┐     ┌─────────┐
 *      │ next()  │     │ 429     │
 *      │ Continue│     │ Response│
 *      └─────────┘     └─────────┘
 * 
 * =============================================================================
 */

