/**
 * =============================================================================
 * LEAKING BUCKET ALGORITHM
 * =============================================================================
 * 
 * 📚 WHAT IS LEAKING BUCKET?
 * 
 * Imagine a bucket with a small hole at the bottom. Requests fill the bucket
 * from the top, and they "leak" out through the hole at a constant rate.
 * If the bucket overflows (too many requests), new requests are dropped.
 * 
 * 🎯 REAL-WORLD ANALOGY:
 * Think of a water tank with a drainage pipe:
 * - Water (requests) pours in from the top
 * - Water drains out at a constant rate through the pipe
 * - If water comes in faster than it drains, the tank fills up
 * - Once full, any new water overflows and is lost (request rejected)
 * 
 * 🏢 WHO USES THIS?
 * - Shopify (E-commerce API)
 * - Network traffic shaping (QoS)
 * - NGINX rate limiting
 * 
 * ✅ PROS:
 * - Provides smooth, constant output rate
 * - Memory efficient (only stores queue size + timestamps)
 * - Good for APIs that need predictable load
 * - Prevents traffic bursts from overwhelming servers
 * 
 * ❌ CONS:
 * - Doesn't handle legitimate burst traffic well
 * - Old requests might delay newer, more important ones
 * - Two parameters to tune (bucket size + leak rate)
 * 
 * 🆚 WHY CHOOSE LEAKING BUCKET OVER TOKEN BUCKET?
 * - When you need CONSTANT output rate (e.g., video streaming)
 * - When downstream services can't handle bursts
 * - When fairness matters (FIFO processing)
 * 
 * 💡 KEY DIFFERENCE FROM TOKEN BUCKET:
 * - Token Bucket: Allows bursts (spend all tokens at once)
 * - Leaking Bucket: Smooth output (requests processed at fixed rate)
 */

import { RateLimitResult, RateLimitStore, RateLimitConfig, LeakingBucketState } from '../types';

export class LeakingBucketRateLimiter {
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
   * 1. Get current queue state
   * 2. Calculate how many requests have "leaked" (processed) since last check
   * 3. Remove leaked requests from queue
   * 4. If queue is not full, add new request and allow
   * 5. If queue is full, reject request
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    
    // Get configuration values with defaults
    // queueSize: Maximum requests that can wait in the queue
    // processingRate: How many requests "leak" per second
    const queueSize = this.config.queueSize || this.config.maxRequests;
    const processingRate = this.config.processingRate || (this.config.maxRequests / (this.config.windowMs / 1000));

    // Step 1: Get current queue state from storage
    let state = await this.store.getQueue(key);

    // Step 2: If no state exists, create empty queue
    if (!state) {
      state = {
        queue: [],
        lastLeakTime: now
      };
    }

    // Step 3: Calculate how many requests have "leaked" (been processed)
    // 
    // Formula: leakedCount = (timePassed / 1000) * processingRate
    // 
    // Example:
    // - processingRate = 10 requests/second
    // - timePassed = 500ms (0.5 seconds)
    // - leakedCount = 0.5 * 10 = 5 requests
    const timePassed = now - state.lastLeakTime;
    const leakedCount = Math.floor((timePassed / 1000) * processingRate);

    // Step 4: Remove leaked requests from the queue (FIFO - First In, First Out)
    // WHY FIFO? Ensures fairness - oldest requests are processed first
    if (leakedCount > 0) {
      state.queue = state.queue.slice(leakedCount);
      state.lastLeakTime = now;
    }

    // Step 5: Check if there's room in the queue
    const currentQueueSize = state.queue.length;
    const allowed = currentQueueSize < queueSize;

    if (allowed) {
      // Add request timestamp to queue
      // WHY store timestamp? Useful for debugging and monitoring
      state.queue.push(now);
    }

    // Step 6: Save updated state back to storage
    await this.store.setQueue(key, state, this.config.windowMs * 2);

    // Step 7: Calculate when queue will have space (reset time)
    // If queue is full, calculate when next request will leak
    let resetTime: number;
    let retryAfter: number | undefined;

    if (!allowed && state.queue.length > 0) {
      // Time until one request leaks out
      const timePerRequest = 1000 / processingRate;
      retryAfter = Math.ceil(timePerRequest / 1000);
      resetTime = Math.ceil((now + timePerRequest) / 1000);
    } else {
      // Time until queue is completely empty
      const timeToEmpty = (state.queue.length / processingRate) * 1000;
      resetTime = Math.ceil((now + timeToEmpty) / 1000);
    }

    // Step 8: Return result with all metadata
    return {
      allowed,
      remaining: queueSize - state.queue.length,
      resetTime,
      limit: queueSize,
      retryAfter,
      currentCount: state.queue.length
    };
  }
}

/**
 * =============================================================================
 * VISUAL REPRESENTATION OF LEAKING BUCKET
 * =============================================================================
 * 
 * Initial State (queue size = 4, leak rate = 1 req/sec):
 * 
 *     📥 Requests coming in
 *          ↓
 *     ┌─────────────┐
 *     │             │  ← Empty queue (room for 4)
 *     │             │
 *     │             │
 *     │_____________│
 *          ↓
 *        💧 (1 request/second leaks out)
 * 
 * After 3 requests arrive quickly:
 * 
 *     📥 Request 4 arrives
 *          ↓
 *     ┌─────────────┐
 *     │   Req 1     │  ← Queue has 3 requests
 *     │   Req 2     │
 *     │   Req 3     │
 *     │_____________│
 *          ↓
 *        💧 Processing Req 1...
 * 
 * 1 second later:
 * 
 *     📥 New request can fit!
 *          ↓
 *     ┌─────────────┐
 *     │   Req 2     │  ← Req 1 leaked out
 *     │   Req 3     │
 *     │   Req 4     │
 *     │_____________│
 *          ↓
 *        💧 Processing Req 2...
 * 
 * When bucket is full and new request arrives:
 * 
 *     📥❌ Request REJECTED (overflow!)
 *          ↓
 *     ┌─────────────┐
 *     │   Req 2     │
 *     │   Req 3     │
 *     │   Req 4     │
 *     │   Req 5     │  ← FULL!
 *     │_____________│
 *          ↓
 *        💧 Still processing at same rate
 * 
 * =============================================================================
 */

