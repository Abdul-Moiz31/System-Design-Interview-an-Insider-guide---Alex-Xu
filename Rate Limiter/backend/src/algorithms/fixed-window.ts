/**
 * =============================================================================
 * FIXED WINDOW COUNTER ALGORITHM
 * =============================================================================
 * 
 * 📚 WHAT IS FIXED WINDOW COUNTER?
 * 
 * Time is divided into fixed windows (e.g., every minute). Each window has
 * a counter that tracks how many requests have been made. When the counter
 * exceeds the limit, new requests are rejected until the next window.
 * 
 * 🎯 REAL-WORLD ANALOGY:
 * Think of a museum with timed entry:
 * - Only 100 visitors allowed per hour (10:00-11:00, 11:00-12:00, etc.)
 * - At the start of each hour, the counter resets to 0
 * - Once 100 visitors enter during an hour, no more allowed
 * - At the next hour, everyone can enter again
 * 
 * 🏢 WHO USES THIS?
 * - Simple APIs with basic rate limiting needs
 * - Internal services with predictable traffic
 * 
 * ✅ PROS:
 * - Extremely simple to implement
 * - Memory efficient (just one counter per window)
 * - Easy to understand and debug
 * - Works well with Redis INCR + EXPIRE
 * 
 * ❌ CONS (IMPORTANT!):
 * - ⚠️ EDGE CASE PROBLEM: Can allow 2x the limit at window boundaries!
 *   Example: Limit is 5/minute
 *   - 5 requests at 1:00:59 (allowed, end of window 1)
 *   - 5 requests at 1:01:01 (allowed, start of window 2)
 *   - Result: 10 requests in 2 seconds! (Double the limit)
 * 
 * 🆚 WHY CHOOSE FIXED WINDOW?
 * - When simplicity is more important than precision
 * - When edge case problem is acceptable
 * - For internal APIs with predictable traffic
 * - As a starting point before implementing more complex algorithms
 * 
 * 💡 WHEN TO AVOID:
 * - When you need precise rate limiting
 * - For public APIs where users might exploit the edge case
 * - For security-sensitive operations (login attempts)
 */

import { RateLimitResult, RateLimitStore, RateLimitConfig } from '../types';

export class FixedWindowRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Generate a unique key for the current time window
   * 
   * @param baseKey - The base identifier (e.g., user ID, IP)
   * @returns Key that includes the window identifier
   * 
   * HOW IT WORKS:
   * We append the window start time to create a unique key per window.
   * 
   * Example with 1-minute windows:
   * - Request at 10:05:30 → window starts at 10:05:00 → key: "user123:1620000300"
   * - Request at 10:05:45 → same window → key: "user123:1620000300"
   * - Request at 10:06:15 → new window → key: "user123:1620000360"
   */
  private getWindowKey(baseKey: string): string {
    const windowMs = this.config.windowMs;
    const now = Date.now();
    
    // Calculate window start time by rounding down to nearest window
    // Example: windowMs = 60000 (1 min), now = 12345678
    // windowStart = 12345678 - (12345678 % 60000) = 12300000
    const windowStart = now - (now % windowMs);
    
    return `${baseKey}:${windowStart}`;
  }

  /**
   * Calculate when the current window ends
   */
  private getWindowResetTime(): number {
    const windowMs = this.config.windowMs;
    const now = Date.now();
    const windowStart = now - (now % windowMs);
    const windowEnd = windowStart + windowMs;
    
    // Return as Unix timestamp (seconds)
    return Math.ceil(windowEnd / 1000);
  }

  /**
   * Check if a request should be allowed
   * 
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns RateLimitResult with decision and metadata
   * 
   * HOW IT WORKS:
   * 1. Generate window-specific key
   * 2. Increment counter for this window
   * 3. If counter <= limit, allow request
   * 4. If counter > limit, reject request
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const windowKey = this.getWindowKey(key);
    const maxRequests = this.config.maxRequests;

    // Step 1: Increment the counter atomically
    // WHY atomic? Prevents race conditions in concurrent requests
    // Redis INCR is atomic - perfect for this use case
    const currentCount = await this.store.increment(windowKey, this.config.windowMs);

    // Step 2: Check if under limit
    // WHY <=? First request (count = 1) should be allowed
    const allowed = currentCount <= maxRequests;

    // Step 3: Calculate remaining requests
    const remaining = Math.max(0, maxRequests - currentCount);

    // Step 4: Get reset time
    const resetTime = this.getWindowResetTime();

    // Step 5: Calculate retry-after if blocked
    let retryAfter: number | undefined;
    if (!allowed) {
      const now = Date.now();
      retryAfter = Math.ceil((resetTime * 1000 - now) / 1000);
    }

    // Step 6: Return result
    return {
      allowed,
      remaining,
      resetTime,
      limit: maxRequests,
      retryAfter,
      currentCount
    };
  }
}

/**
 * =============================================================================
 * VISUAL REPRESENTATION OF FIXED WINDOW
 * =============================================================================
 * 
 * Timeline with 1-minute windows, limit = 5 requests/minute:
 * 
 *   Window 1 (10:00-10:01)    Window 2 (10:01-10:02)    Window 3 (10:02-10:03)
 *   ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
 *   │ R R R R R          │    │ R R R              │    │ R                  │
 *   │ 1 2 3 4 5          │    │ 1 2 3              │    │ 1                  │
 *   └────────────────────┘    └────────────────────┘    └────────────────────┘
 *         ↑                         ↑                         ↑
 *     Counter = 5               Counter = 3               Counter = 1
 *     (FULL - next               (OK - 2 more              (OK - 4 more
 *      request blocked)           allowed)                  allowed)
 * 
 * =============================================================================
 * THE EDGE CASE PROBLEM (Why this algorithm isn't perfect):
 * =============================================================================
 * 
 * Limit: 5 requests per minute
 * 
 *          Window 1                    Window 2
 *   ┌───────────┬──────────┐    ┌──────────┬───────────┐
 *   │           │ R R R R R│    │R R R R R │           │
 *   │           │← 5 req @ │    │@ 10:01:01│           │
 *   │           │  10:00:59│    │→ 5 req   │           │
 *   └───────────┴──────────┘    └──────────┴───────────┘
 *                    ↑              ↑
 *                    │              │
 *                    └──── 10 requests in 2 seconds! ────┘
 * 
 * Both windows allow 5 requests, but at the boundary,
 * a malicious user could send 10 requests in ~2 seconds!
 * 
 * This is why we have Sliding Window algorithms!
 * 
 * =============================================================================
 */

