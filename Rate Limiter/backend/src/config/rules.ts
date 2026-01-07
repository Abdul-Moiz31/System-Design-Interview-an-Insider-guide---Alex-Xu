/**
 * =============================================================================
 * RATE LIMITING RULES CONFIGURATION
 * =============================================================================
 * 
 * 📚 WHAT IS THIS?
 * 
 * This file defines the rate limiting rules for different endpoints and
 * use cases. In production, these might come from:
 * - A database
 * - A configuration service (e.g., Consul, etcd)
 * - Environment variables
 * - YAML/JSON config files
 * 
 * 🎯 WHY SEPARATE CONFIGURATION?
 * 
 * 1. Flexibility: Change limits without code changes
 * 2. Environment-specific: Different limits for dev/staging/prod
 * 3. A/B Testing: Test different limits easily
 * 4. Quick Response: Adjust limits during attacks or traffic spikes
 * 
 * 💡 REAL-WORLD EXAMPLES:
 * 
 * Twitter API (2023):
 * - 300 tweets per 3 hours
 * - 1000 follows per day
 * - 500 direct messages per day
 * 
 * GitHub API:
 * - 5000 requests per hour (authenticated)
 * - 60 requests per hour (unauthenticated)
 * 
 * Stripe API:
 * - 100 requests per second in live mode
 * - 25 requests per second in test mode
 */

import { RateLimitConfig, RateLimitAlgorithm } from '../types';

/**
 * Pre-defined rate limiting configurations for different scenarios
 * 
 * Each configuration is designed for a specific use case:
 * - Different algorithms for different needs
 * - Different limits for different sensitivity levels
 */
export const rateLimitPresets: Record<string, RateLimitConfig> = {
  /**
   * STANDARD API - General purpose rate limiting
   * 
   * Use case: Regular API endpoints
   * Algorithm: Sliding Window Counter (good balance of accuracy and efficiency)
   * Limit: 100 requests per minute
   */
  standard: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100,
    algorithm: 'SLIDING_WINDOW_COUNTER',
    message: 'Too many requests, please try again later.',
    headers: true
  },

  /**
   * STRICT - For sensitive operations
   * 
   * Use case: Login attempts, password reset, payment operations
   * Algorithm: Sliding Window Log (most accurate, no edge cases)
   * Limit: 5 requests per minute
   * 
   * WHY SLIDING_WINDOW_LOG?
   * - Security-critical = need exact counting
   * - Low volume = memory not a concern
   * - Can't afford to let extra requests through
   */
  strict: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 5,
    algorithm: 'SLIDING_WINDOW_LOG',
    message: 'Too many attempts. Please wait before trying again.',
    headers: true
  },

  /**
   * RELAXED - For less sensitive operations
   * 
   * Use case: Reading public data, health checks
   * Algorithm: Fixed Window (simplest, fast)
   * Limit: 1000 requests per minute
   * 
   * WHY FIXED_WINDOW?
   * - Less critical = edge case problem is acceptable
   * - High volume = need maximum efficiency
   * - Simple to understand and debug
   */
  relaxed: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 1000,
    algorithm: 'FIXED_WINDOW',
    message: 'Rate limit exceeded.',
    headers: true
  },

  /**
   * BURST - Allows temporary spikes
   * 
   * Use case: APIs that need to handle traffic bursts
   * Algorithm: Token Bucket (accumulates tokens over time)
   * Config: 10 token bucket, refills 2 tokens per second
   * 
   * WHY TOKEN_BUCKET?
   * - Allows bursts of up to 10 requests instantly
   * - Then smoothly limits to 2 requests/second average
   * - Perfect for bursty traffic patterns
   */
  burst: {
    windowMs: 10 * 1000,        // 10 seconds
    maxRequests: 20,            // Max 20 in 10 seconds = 2/sec average
    algorithm: 'TOKEN_BUCKET',
    bucketSize: 10,             // Can handle burst of 10
    refillRate: 2,              // 2 tokens per second
    refillInterval: 1000,       // Refill every second
    message: 'Too many requests. Please slow down.',
    headers: true
  },

  /**
   * QUEUE - Smooth processing rate
   * 
   * Use case: Background job submission, file uploads
   * Algorithm: Leaking Bucket (constant processing rate)
   * Config: Queue of 5, processes 1 per second
   * 
   * WHY LEAKING_BUCKET?
   * - Downstream services need constant load
   * - Don't want bursts overwhelming the system
   * - FIFO fairness (first come, first served)
   */
  queue: {
    windowMs: 10 * 1000,
    maxRequests: 10,
    algorithm: 'LEAKING_BUCKET',
    queueSize: 5,
    processingRate: 1,          // 1 request per second
    message: 'Server is busy. Please try again in a moment.',
    headers: true
  },

  /**
   * PER_SECOND - High throughput APIs
   * 
   * Use case: Real-time APIs, game servers
   * Algorithm: Token Bucket
   * Limit: 50 requests per second with burst of 100
   */
  perSecond: {
    windowMs: 1000,             // 1 second
    maxRequests: 50,
    algorithm: 'TOKEN_BUCKET',
    bucketSize: 100,            // Allow burst of 100
    refillRate: 50,
    refillInterval: 1000,
    message: 'Rate limit exceeded. Please reduce request frequency.',
    headers: true
  },

  /**
   * DAILY - Long-term limits
   * 
   * Use case: API key quotas, email sending limits
   * Algorithm: Fixed Window (simple for long windows)
   * Limit: 10000 requests per day
   */
  daily: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10000,
    algorithm: 'FIXED_WINDOW',
    message: 'Daily limit exceeded. Limit resets at midnight UTC.',
    headers: true
  }
};

/**
 * Get a preset configuration by name
 */
export function getPreset(name: string): RateLimitConfig | undefined {
  return rateLimitPresets[name];
}

/**
 * Create a custom configuration
 * 
 * This merges default values with provided options,
 * making it easy to create custom configs.
 */
export function createConfig(
  options: Partial<RateLimitConfig> & { 
    windowMs: number; 
    maxRequests: number; 
    algorithm: RateLimitAlgorithm;
  }
): RateLimitConfig {
  return {
    headers: true,
    statusCode: 429,
    message: 'Too Many Requests',
    ...options
  };
}

/**
 * =============================================================================
 * ALGORITHM SELECTION GUIDE
 * =============================================================================
 * 
 * ┌────────────────────┬───────────────────────────────────────────────────────┐
 * │ Use Case           │ Recommended Algorithm                                 │
 * ├────────────────────┼───────────────────────────────────────────────────────┤
 * │ Login attempts     │ SLIDING_WINDOW_LOG (most accurate)                    │
 * │ Password reset     │ SLIDING_WINDOW_LOG                                    │
 * │ Payment API        │ SLIDING_WINDOW_LOG                                    │
 * ├────────────────────┼───────────────────────────────────────────────────────┤
 * │ General API        │ SLIDING_WINDOW_COUNTER (good balance)                 │
 * │ User requests      │ SLIDING_WINDOW_COUNTER                                │
 * │ Default choice     │ SLIDING_WINDOW_COUNTER                                │
 * ├────────────────────┼───────────────────────────────────────────────────────┤
 * │ Bursty traffic     │ TOKEN_BUCKET (allows bursts)                          │
 * │ Mobile apps        │ TOKEN_BUCKET                                          │
 * │ Gaming APIs        │ TOKEN_BUCKET                                          │
 * ├────────────────────┼───────────────────────────────────────────────────────┤
 * │ Background jobs    │ LEAKING_BUCKET (constant rate)                        │
 * │ File processing    │ LEAKING_BUCKET                                        │
 * │ Queue-like needs   │ LEAKING_BUCKET                                        │
 * ├────────────────────┼───────────────────────────────────────────────────────┤
 * │ Simple/Internal    │ FIXED_WINDOW (simplest)                               │
 * │ Low-stakes API     │ FIXED_WINDOW                                          │
 * │ Quick prototype    │ FIXED_WINDOW                                          │
 * └────────────────────┴───────────────────────────────────────────────────────┘
 * 
 * =============================================================================
 */

