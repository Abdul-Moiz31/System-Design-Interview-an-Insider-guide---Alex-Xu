/**
 * =============================================================================
 * TOKEN BUCKET ALGORITHM
 * =============================================================================
 * 
 * 📚 WHAT IS TOKEN BUCKET?
 * 
 * Imagine a bucket that can hold a limited number of tokens. Tokens are added
 * to the bucket at a fixed rate (like water dripping into a bucket). When a
 * request comes in, it takes one token from the bucket. If the bucket is empty,
 * the request is rejected.
 * 
 * 🎯 REAL-WORLD ANALOGY:
 * Think of a parking garage:
 * - The garage has 100 parking spots (bucket capacity)
 * - Cars leave at a certain rate, freeing up spots (token refill)
 * - New cars can park if there's an empty spot (request allowed)
 * - If the garage is full, cars must wait outside (request rejected)
 * 
 * 🏢 WHO USES THIS?
 * - Amazon AWS (API Gateway)
 * - Stripe (Payment API)
 * - Twitter (API rate limiting)
 * 
 * ✅ PROS:
 * - Allows burst traffic (can use all tokens at once)
 * - Memory efficient (only stores 2 values: tokens + lastRefillTime)
 * - Simple to implement
 * - Smooth rate limiting over time
 * 
 * ❌ CONS:
 * - Two parameters to tune (bucket size + refill rate)
 * - Burst traffic might overwhelm downstream services
 * 
 * 🆚 WHY CHOOSE TOKEN BUCKET OVER OTHERS?
 * - Choose over Fixed Window: Avoids the "edge of window" problem
 * - Choose over Leaking Bucket: When you WANT to allow bursts
 * - Choose over Sliding Window Log: When memory is a concern
 */

import { RateLimitResult, RateLimitStore, RateLimitConfig, TokenBucketState } from '../types';

export class TokenBucketRateLimiter {
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
   * 1. Get current bucket state (or create new one if doesn't exist)
   * 2. Calculate how many tokens should be added since last refill
   * 3. If tokens available, consume one and allow request
   * 4. If no tokens, reject request
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    
    // Get configuration values with defaults
    // bucketSize: Maximum tokens the bucket can hold
    // refillRate: How many tokens to add per interval
    // refillInterval: How often to add tokens (in ms)
    const bucketSize = this.config.bucketSize || this.config.maxRequests;
    const refillRate = this.config.refillRate || 1;
    const refillInterval = this.config.refillInterval || (this.config.windowMs / this.config.maxRequests);

    // Step 1: Get current bucket state from storage
    let state = await this.store.getBucketState(key);

    // Step 2: If no state exists, create a full bucket
    // WHY start full? So the first request is always allowed
    if (!state) {
      state = {
        tokens: bucketSize,
        lastRefillTime: now
      };
    }

    // Step 3: Calculate how many tokens to add (refill)
    // 
    // Formula: tokensToAdd = (timePassed / refillInterval) * refillRate
    // 
    // Example:
    // - refillInterval = 1000ms (1 second)
    // - refillRate = 2 tokens
    // - timePassed = 5000ms (5 seconds)
    // - tokensToAdd = (5000 / 1000) * 2 = 10 tokens
    const timePassed = now - state.lastRefillTime;
    const tokensToAdd = Math.floor(timePassed / refillInterval) * refillRate;

    // Add tokens but don't exceed bucket capacity
    // WHY cap at bucketSize? Prevents accumulating infinite tokens during idle periods
    state.tokens = Math.min(bucketSize, state.tokens + tokensToAdd);

    // Update lastRefillTime only if we actually added tokens
    // WHY? To avoid losing partial time intervals
    if (tokensToAdd > 0) {
      state.lastRefillTime = now;
    }

    // Step 4: Check if we have tokens available
    const allowed = state.tokens > 0;

    if (allowed) {
      // Consume one token
      state.tokens -= 1;
    }

    // Step 5: Save updated state back to storage
    // TTL = windowMs * 2 to ensure state survives across windows
    await this.store.setBucketState(key, state, this.config.windowMs * 2);

    // Step 6: Calculate reset time
    // Reset time = when the bucket will be full again
    const tokensNeeded = bucketSize - state.tokens;
    const timeToFullMs = (tokensNeeded / refillRate) * refillInterval;
    const resetTime = Math.ceil((now + timeToFullMs) / 1000); // Convert to Unix seconds

    // Step 7: Return result with all metadata
    return {
      allowed,
      remaining: Math.max(0, state.tokens),
      resetTime,
      limit: bucketSize,
      retryAfter: allowed ? undefined : Math.ceil(refillInterval / 1000),
      currentCount: bucketSize - state.tokens
    };
  }
}

/**
 * =============================================================================
 * VISUAL REPRESENTATION OF TOKEN BUCKET
 * =============================================================================
 * 
 * Initial State (bucket size = 4):
 * 
 *     ┌─────────────┐
 *     │  🪙 🪙 🪙 🪙 │  ← Full bucket (4 tokens)
 *     └─────────────┘
 *           ↑
 *     Refill Rate: 2 tokens/second
 * 
 * After 3 requests:
 * 
 *     ┌─────────────┐
 *     │  🪙         │  ← 1 token remaining
 *     └─────────────┘
 *           ↑
 *     Still refilling...
 * 
 * After 1 second (2 tokens refilled):
 * 
 *     ┌─────────────┐
 *     │  🪙 🪙 🪙   │  ← 3 tokens now
 *     └─────────────┘
 * 
 * =============================================================================
 */

