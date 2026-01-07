/**
 * =============================================================================
 * SLIDING WINDOW COUNTER ALGORITHM
 * =============================================================================
 * 
 * 📚 WHAT IS SLIDING WINDOW COUNTER?
 * 
 * A clever HYBRID of Fixed Window and Sliding Window Log. It uses counters
 * (like Fixed Window) but applies a weighted calculation based on how far
 * we are into the current window (like Sliding Window).
 * 
 * 🎯 REAL-WORLD ANALOGY:
 * Imagine you're a cafe owner tracking hourly customers:
 * - You had 60 customers last hour (10:00-11:00)
 * - It's now 11:20 (20 minutes = 33% into the new hour)
 * - Current hour so far: 15 customers
 * - Estimate for "rolling hour": 15 + (60 × 0.67) = 15 + 40 = 55 customers
 * 
 * 🏢 WHO USES THIS?
 * - Cloudflare (One of the largest CDN/security providers)
 * - High-traffic APIs
 * - Services needing both accuracy and efficiency
 * 
 * ✅ PROS:
 * - Memory efficient (only 2 counters per window)
 * - Good accuracy (Cloudflare reports only 0.003% error rate!)
 * - Smooths out traffic spikes
 * - Best of both worlds: efficiency + accuracy
 * 
 * ❌ CONS:
 * - Approximation, not exact count
 * - Assumes uniform distribution of requests in previous window
 * - Slightly more complex than Fixed Window
 * 
 * 🆚 WHY CHOOSE SLIDING WINDOW COUNTER?
 * - When you need better accuracy than Fixed Window
 * - When you can't afford memory cost of Sliding Window Log
 * - For high-traffic APIs (best balance)
 * - When 0.003% error rate is acceptable
 * 
 * 💡 THE MAGIC FORMULA:
 * 
 * estimated_count = current_window_count + (previous_window_count × overlap_ratio)
 * 
 * Where overlap_ratio = 1 - (time_into_current_window / window_duration)
 * 
 * Example:
 * - Previous window: 70 requests
 * - Current window: 20 requests  
 * - We're 30% into current window
 * - Overlap with previous: 70% (100% - 30%)
 * - Estimated: 20 + (70 × 0.7) = 20 + 49 = 69 requests
 */

import { RateLimitResult, RateLimitStore, RateLimitConfig } from '../types';

export class SlidingWindowCounterRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Generate keys for current and previous windows
   */
  private getWindowKeys(baseKey: string): { currentKey: string; previousKey: string; windowStart: number } {
    const windowMs = this.config.windowMs;
    const now = Date.now();
    
    // Calculate current window start
    const windowStart = now - (now % windowMs);
    // Calculate previous window start
    const previousWindowStart = windowStart - windowMs;
    
    return {
      currentKey: `${baseKey}:${windowStart}`,
      previousKey: `${baseKey}:${previousWindowStart}`,
      windowStart
    };
  }

  /**
   * Calculate the overlap percentage with the previous window
   * 
   * @returns A number between 0 and 1 representing how much of the
   *          previous window should be considered
   * 
   * Example:
   * - Window = 60 seconds
   * - We're 20 seconds into the current window
   * - Position in window = 20/60 = 0.333
   * - Overlap with previous = 1 - 0.333 = 0.667 (67%)
   */
  private getOverlapRatio(): number {
    const windowMs = this.config.windowMs;
    const now = Date.now();
    
    // How far into the current window are we?
    const positionInWindow = now % windowMs;
    
    // What percentage of the previous window overlaps with our sliding window?
    const overlapRatio = 1 - (positionInWindow / windowMs);
    
    return overlapRatio;
  }

  /**
   * Check if a request should be allowed
   * 
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns RateLimitResult with decision and metadata
   * 
   * HOW IT WORKS:
   * 1. Get counters for current and previous windows
   * 2. Calculate weighted average based on time position
   * 3. If estimated total < limit, allow and increment
   * 4. If estimated total >= limit, reject
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // Step 1: Get window keys
    const { currentKey, previousKey, windowStart } = this.getWindowKeys(key);

    // Step 2: Get current counts from both windows
    // These are simple counters, very memory efficient!
    const currentWindowCount = await this.store.get(currentKey) || 0;
    const previousWindowCount = await this.store.get(previousKey) || 0;

    // Step 3: Calculate overlap ratio
    const overlapRatio = this.getOverlapRatio();

    // Step 4: Calculate estimated request count using the weighted formula
    // 
    // The magic happens here! We estimate the true sliding window count by:
    // - Taking all requests in the current window (they all count)
    // - Adding a percentage of previous window requests (based on overlap)
    //
    // This assumes requests in the previous window were evenly distributed.
    // Cloudflare's research shows this is accurate 99.997% of the time!
    const estimatedCount = currentWindowCount + (previousWindowCount * overlapRatio);

    // Step 5: Check if under limit
    // WHY use floor for the estimated count? Be slightly lenient rather than strict
    const allowed = Math.floor(estimatedCount) < maxRequests;

    // Step 6: If allowed, increment the current window counter
    if (allowed) {
      await this.store.increment(currentKey, windowMs);
    }

    // Step 7: Calculate remaining requests
    const remaining = Math.max(0, maxRequests - Math.floor(estimatedCount) - (allowed ? 1 : 0));

    // Step 8: Calculate reset time (when current window ends)
    const windowEnd = windowStart + windowMs;
    const resetTime = Math.ceil(windowEnd / 1000);

    // Step 9: Calculate retry-after if blocked
    let retryAfter: number | undefined;
    if (!allowed) {
      // Calculate when enough requests will "expire" from our estimate
      // This is approximate since we're using a weighted estimate
      const requestsOverLimit = Math.floor(estimatedCount) - maxRequests + 1;
      const timePerRequest = windowMs / maxRequests;
      retryAfter = Math.max(1, Math.ceil((requestsOverLimit * timePerRequest) / 1000));
    }

    // Step 10: Return result
    return {
      allowed,
      remaining,
      resetTime,
      limit: maxRequests,
      retryAfter,
      currentCount: Math.floor(estimatedCount) + (allowed ? 1 : 0)
    };
  }
}

/**
 * =============================================================================
 * VISUAL REPRESENTATION OF SLIDING WINDOW COUNTER
 * =============================================================================
 * 
 * Limit: 100 requests per minute
 * 
 * Previous Window (10:00-10:01)     Current Window (10:01-10:02)
 * ┌─────────────────────────────┐   ┌─────────────────────────────┐
 * │ ████████████████████████████│   │ ████████░░░░░░░░░░░░░░░░░░░░│
 * │          70 requests        │   │  30 req        │            │
 * └─────────────────────────────┘   └────────────────┼────────────┘
 *                                                    │
 *                                                10:01:25
 *                                                  (NOW)
 * 
 * Calculation at 10:01:25 (25 seconds = 42% into current window):
 * 
 * Step 1: Position in window = 25 sec / 60 sec = 0.42 (42%)
 * Step 2: Overlap ratio = 1 - 0.42 = 0.58 (58%)
 * Step 3: Estimated count = 30 + (70 × 0.58) = 30 + 41 = 71 requests
 * 
 * ├───────────────── 1 minute sliding window ─────────────────┤
 * │                                                           │
 * │  Previous Window                  Current Window          │
 * │  (58% overlap)                    (100% counts)           │
 * │  ┌───────────────┐               ┌────────────┐           │
 * │  │░░░░░░│████████│               │████████████│           │
 * │  │      │ 70×0.58│               │     30     │           │
 * │  │      │ = 41   │               │            │           │
 * │  └──────┴────────┘               └────────────┘           │
 * │         └────────────┬────────────────┘                   │
 * │                   = 71 estimated requests                  │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 * 
 * Since 71 < 100 (limit), the request is ALLOWED!
 * 
 * =============================================================================
 * WHY THE ASSUMPTION WORKS:
 * =============================================================================
 * 
 * We assume requests in the previous window were evenly distributed.
 * 
 * Reality:   |  *  * ** *   *  * **|
 * Assumed:   |* * * * * * * * * * *|
 *            └────────────────────┘
 *                   Previous window
 * 
 * This assumption is wrong for individual windows, but over many windows
 * and many users, the errors average out. Cloudflare's data shows only
 * 0.003% of requests are wrongly allowed or blocked!
 * 
 * =============================================================================
 * MEMORY COMPARISON:
 * =============================================================================
 * 
 * For 1 million users, 100 req/min limit:
 * 
 * Sliding Window LOG:     800 MB (100 timestamps × 8 bytes × 1M users)
 * Sliding Window COUNTER: 16 MB  (2 counters × 8 bytes × 1M users)
 * 
 * That's 50x less memory!
 * 
 * =============================================================================
 */

