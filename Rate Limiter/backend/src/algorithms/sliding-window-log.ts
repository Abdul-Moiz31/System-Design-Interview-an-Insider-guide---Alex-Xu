/**
 * =============================================================================
 * SLIDING WINDOW LOG ALGORITHM
 * =============================================================================
 * 
 * 📚 WHAT IS SLIDING WINDOW LOG?
 * 
 * Instead of dividing time into fixed windows, we track the exact timestamp
 * of every request. When a new request comes in, we look back in time by
 * the window duration and count how many requests are in that range.
 * 
 * 🎯 REAL-WORLD ANALOGY:
 * Think of a "rolling 24-hour" news cycle:
 * - At any moment, you look at what happened in the LAST 24 hours
 * - It's not midnight-to-midnight, it's "right now minus 24 hours"
 * - The window constantly slides forward with time
 * 
 * 🏢 WHO USES THIS?
 * - High-security applications (login attempt limiting)
 * - Financial systems (fraud detection)
 * - APIs requiring precise rate limiting
 * 
 * ✅ PROS:
 * - Most accurate algorithm - no edge case problems!
 * - The rate limit is ALWAYS enforced precisely
 * - Perfect for security-sensitive operations
 * 
 * ❌ CONS:
 * - ⚠️ Memory intensive - stores timestamp of EVERY request
 *   Example: 1000 requests/second × 60 second window = 60,000 timestamps!
 * - Slightly more CPU intensive (filtering old timestamps)
 * 
 * 🆚 WHY CHOOSE SLIDING WINDOW LOG?
 * - When you need EXACT rate limiting (no approximations)
 * - For security features (login attempts, password resets)
 * - When memory is not a constraint
 * - For low-volume, high-value operations
 * 
 * 💡 WHEN TO AVOID:
 * - High-traffic APIs (memory explosion)
 * - When approximate limiting is acceptable
 * - Resource-constrained environments
 * 
 * 🔧 REDIS IMPLEMENTATION NOTE:
 * Redis Sorted Sets are perfect for this:
 * - ZADD: Add timestamp with score = timestamp
 * - ZREMRANGEBYSCORE: Remove old timestamps
 * - ZCARD: Count remaining timestamps
 * This is O(log N) for all operations!
 */

import { RateLimitResult, RateLimitStore, RateLimitConfig } from '../types';

export class SlidingWindowLogRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Check if a request should be allowed
   * 
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns RateLimitResult with decision and metadata
   * 
   * HOW IT WORKS:
   * 1. Calculate the start of the current sliding window
   * 2. Remove all timestamps older than the window start
   * 3. Count remaining timestamps
   * 4. If count < limit, add new timestamp and allow
   * 5. If count >= limit, reject
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // Step 1: Calculate the start of the sliding window
    // This is "now minus window duration"
    // Example: If windowMs = 60000 (1 minute) and now = 1000000
    // then windowStart = 940000 (40 seconds ago)
    const windowStart = now - windowMs;

    // Step 2: Remove old timestamps (outside the window)
    // WHY? These requests no longer count against the limit
    // This is like "forgetting" old requests as time passes
    await this.store.removeOldTimestamps(key, windowStart);

    // Step 3: Get all timestamps within the current window
    const timestamps = await this.store.getTimestamps(key, windowStart);
    const currentCount = timestamps.length;

    // Step 4: Check if under limit
    // WHY <? If we have exactly maxRequests, the new one would exceed the limit
    const allowed = currentCount < maxRequests;

    // Step 5: If allowed, add the new request's timestamp
    // WHY store even if rejected? Original algorithm stores all, but we optimize
    // by only storing allowed requests (saves memory, same behavior)
    if (allowed) {
      await this.store.addTimestamp(key, now, windowMs);
    }

    // Step 6: Calculate remaining requests
    const remaining = Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0));

    // Step 7: Calculate reset time
    // The oldest request in our window determines when we'll have capacity
    // When that request "falls out" of the window, we can accept a new one
    let resetTime: number;
    let retryAfter: number | undefined;

    if (!allowed && timestamps.length > 0) {
      // The oldest timestamp in our window
      const oldestTimestamp = Math.min(...timestamps);
      // When this timestamp falls out of the window, we can accept a new request
      const whenOldestExpires = oldestTimestamp + windowMs;
      resetTime = Math.ceil(whenOldestExpires / 1000);
      retryAfter = Math.max(1, Math.ceil((whenOldestExpires - now) / 1000));
    } else {
      // Window is not full, reset time is end of window from now
      resetTime = Math.ceil((now + windowMs) / 1000);
    }

    // Step 8: Return result
    return {
      allowed,
      remaining,
      resetTime,
      limit: maxRequests,
      retryAfter,
      currentCount: currentCount + (allowed ? 1 : 0)
    };
  }
}

/**
 * =============================================================================
 * VISUAL REPRESENTATION OF SLIDING WINDOW LOG
 * =============================================================================
 * 
 * Limit: 5 requests per minute
 * 
 * Request Log (timestamps in seconds):
 * [10:00:15, 10:00:30, 10:00:45, 10:01:00, 10:01:10]
 * 
 * At 10:01:20 (new request arrives):
 * 
 * ──────────────────────────────────────────────────────────→ Time
 *     │                                                │
 *  10:00:20                                        10:01:20
 *  (window start)                                  (now)
 *     │                                                │
 *     │←────────────── 1 minute window ───────────────→│
 *     │                                                │
 *     │   ✗    ✓      ✓      ✓       ✓      ✓    ?   │
 *     │ 10:00:15  10:00:30  10:00:45  10:01:00  10:01:10    │
 *     │   (old)    (in window)                         │
 * 
 * Step 1: Remove 10:00:15 (it's before 10:00:20, outside window)
 * Step 2: Count remaining: 4 requests
 * Step 3: 4 < 5 (limit), so ALLOW the new request
 * Step 4: Add 10:01:20 to the log
 * 
 * New Log: [10:00:30, 10:00:45, 10:01:00, 10:01:10, 10:01:20]
 * 
 * =============================================================================
 * WHY THIS IS MORE ACCURATE THAN FIXED WINDOW:
 * =============================================================================
 * 
 * At any point in time, we look at the EXACT previous minute.
 * There's no "window boundary" that can be exploited!
 * 
 * At 10:01:30, the window is 10:00:30 to 10:01:30
 * At 10:01:31, the window is 10:00:31 to 10:01:31
 * 
 * The window SLIDES smoothly with time, hence "sliding window"!
 * 
 * =============================================================================
 * MEMORY CONSIDERATION:
 * =============================================================================
 * 
 * For each user/key, we store:
 * - With 100 req/min limit: up to 100 timestamps
 * - Each timestamp: ~8 bytes (64-bit number)
 * - Per user: 100 × 8 = 800 bytes
 * 
 * For 1 million users: 800 × 1,000,000 = 800 MB
 * 
 * This is why Sliding Window Counter exists - it's a compromise!
 * 
 * =============================================================================
 */

