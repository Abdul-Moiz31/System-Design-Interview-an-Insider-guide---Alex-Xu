/**
 * =============================================================================
 * RATE LIMITER TYPE DEFINITIONS
 * =============================================================================
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the rate limiter system. Having a centralized types file helps with:
 * 
 * 1. Type Safety: Catch errors at compile time instead of runtime
 * 2. Documentation: Types serve as self-documenting code
 * 3. Maintainability: Single source of truth for data structures
 * 4. IDE Support: Better autocomplete and error checking
 */

/**
 * Represents the result of a rate limit check
 * 
 * WHY this structure?
 * - `allowed`: Boolean is simple and efficient for decision making
 * - `remaining`: Helps clients implement backoff strategies
 * - `resetTime`: Clients know when they can retry
 * - `limit`: Useful for displaying to users
 * - `retryAfter`: Standard HTTP header value for 429 responses
 */
export interface RateLimitResult {
  allowed: boolean;           // Is the request allowed?
  remaining: number;          // How many requests left in the window?
  resetTime: number;          // Unix timestamp when the limit resets
  limit: number;              // Maximum requests allowed
  retryAfter?: number;        // Seconds until the client can retry
  currentCount?: number;      // Current request count (for debugging/UI)
}

/**
 * Configuration for rate limiting rules
 * 
 * WHY these options?
 * - `windowMs`: Flexibility to define any time window (seconds, minutes, hours)
 * - `maxRequests`: The actual limit - how many requests per window
 * - `keyGenerator`: Flexibility to limit by IP, user ID, API key, etc.
 * - `algorithm`: Support multiple algorithms for different use cases
 * - `skipFailedRequests`: Don't count failed requests (e.g., 4xx errors)
 * - `skipSuccessfulRequests`: Only count failures (for login attempts)
 */
export interface RateLimitConfig {
  windowMs: number;                           // Time window in milliseconds
  maxRequests: number;                        // Max requests per window
  keyGenerator?: (req: any) => string;        // Function to generate unique key
  algorithm: RateLimitAlgorithm;              // Which algorithm to use
  skipFailedRequests?: boolean;               // Don't count failed requests
  skipSuccessfulRequests?: boolean;           // Don't count successful requests
  message?: string;                           // Custom error message
  statusCode?: number;                        // HTTP status code (default: 429)
  headers?: boolean;                          // Send rate limit headers?
  
  // Token Bucket specific
  bucketSize?: number;                        // Maximum tokens in bucket
  refillRate?: number;                        // Tokens added per interval
  refillInterval?: number;                    // Interval for refilling (ms)
  
  // Leaking Bucket specific
  queueSize?: number;                         // Maximum queue size
  processingRate?: number;                    // Requests processed per second
}

/**
 * Available rate limiting algorithms
 * 
 * WHY these 5 algorithms?
 * 
 * 1. TOKEN_BUCKET: Best for APIs that allow bursts (Amazon, Stripe use this)
 *    - Pros: Allows bursts, memory efficient
 *    - Cons: Two parameters to tune
 * 
 * 2. LEAKING_BUCKET: Best for stable outflow (Shopify uses this)
 *    - Pros: Smooth traffic, memory efficient
 *    - Cons: Recent requests may be delayed during bursts
 * 
 * 3. FIXED_WINDOW: Simplest algorithm
 *    - Pros: Easy to understand, memory efficient
 *    - Cons: Edge case problem (2x requests at window boundary)
 * 
 * 4. SLIDING_WINDOW_LOG: Most accurate
 *    - Pros: Very accurate, no edge case problem
 *    - Cons: Memory intensive (stores all timestamps)
 * 
 * 5. SLIDING_WINDOW_COUNTER: Best balance (Cloudflare uses this)
 *    - Pros: Memory efficient, accurate enough
 *    - Cons: Approximation based on previous window
 */
export type RateLimitAlgorithm = 
  | 'TOKEN_BUCKET'
  | 'LEAKING_BUCKET'
  | 'FIXED_WINDOW'
  | 'SLIDING_WINDOW_LOG'
  | 'SLIDING_WINDOW_COUNTER';

/**
 * Storage interface for rate limit data
 * 
 * WHY an interface?
 * - Abstraction: Same code works with different storage backends
 * - Testing: Easy to mock for unit tests
 * - Flexibility: Switch between memory, Redis, Memcached without code changes
 * - Scaling: Memory for single server, Redis for distributed systems
 */
export interface RateLimitStore {
  // Increment a counter and return new value
  increment(key: string, windowMs: number): Promise<number>;
  
  // Get current value
  get(key: string): Promise<number | null>;
  
  // Set a value with expiration
  set(key: string, value: number, windowMs: number): Promise<void>;
  
  // Delete a key
  delete(key: string): Promise<void>;
  
  // Get remaining TTL in milliseconds
  getTTL(key: string): Promise<number>;
  
  // For sliding window log - add timestamp
  addTimestamp(key: string, timestamp: number, windowMs: number): Promise<void>;
  
  // For sliding window log - get timestamps in range
  getTimestamps(key: string, minTimestamp: number): Promise<number[]>;
  
  // For sliding window log - remove old timestamps
  removeOldTimestamps(key: string, minTimestamp: number): Promise<void>;
  
  // For token bucket - get bucket state
  getBucketState(key: string): Promise<TokenBucketState | null>;
  
  // For token bucket - set bucket state
  setBucketState(key: string, state: TokenBucketState, ttlMs: number): Promise<void>;
  
  // For leaking bucket - get queue
  getQueue(key: string): Promise<LeakingBucketState | null>;
  
  // For leaking bucket - set queue
  setQueue(key: string, state: LeakingBucketState, ttlMs: number): Promise<void>;
  
  // Reset all data (for testing)
  reset(): Promise<void>;
}

/**
 * Token Bucket internal state
 * 
 * WHY these fields?
 * - tokens: Current number of tokens available
 * - lastRefillTime: When we last added tokens (to calculate new tokens)
 */
export interface TokenBucketState {
  tokens: number;
  lastRefillTime: number;
}

/**
 * Leaking Bucket internal state
 * 
 * WHY these fields?
 * - queue: Pending requests waiting to be processed
 * - lastLeakTime: When we last processed requests (to calculate how many leaked)
 */
export interface LeakingBucketState {
  queue: number[];              // Timestamps of queued requests
  lastLeakTime: number;
}

/**
 * HTTP Request Headers that rate limiter sends back
 * 
 * WHY these headers?
 * These are industry-standard headers (draft-ietf-httpapi-ratelimit-headers)
 * that clients expect and can use for:
 * - Displaying rate limit info to users
 * - Implementing automatic retry logic
 * - Adjusting request frequency
 */
export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;        // Max requests per window
  'X-RateLimit-Remaining': number;    // Requests left in current window
  'X-RateLimit-Reset': number;        // Unix timestamp when window resets
  'Retry-After'?: number;             // Seconds to wait before retrying
}

/**
 * Rate limiting rule for configuration
 * 
 * WHY this structure?
 * Inspired by Lyft's open-source rate limiter (Envoy)
 * - domain: Group rules logically (auth, api, messaging)
 * - descriptor: The specific rule within that domain
 * - rateLimit: The actual limit configuration
 */
export interface RateLimitRule {
  domain: string;                     // Logical grouping (e.g., "auth", "api")
  descriptor: {
    key: string;                      // What to match (e.g., "endpoint", "user_type")
    value: string;                    // Value to match
  };
  rateLimit: {
    unit: 'second' | 'minute' | 'hour' | 'day';
    requestsPerUnit: number;
  };
  algorithm?: RateLimitAlgorithm;     // Override default algorithm
}

// Export use cases types
export * from './use-cases';

/**
 * Statistics for monitoring the rate limiter
 * 
 * WHY track these?
 * - totalRequests: Understand traffic patterns
 * - allowedRequests: Baseline of normal traffic
 * - blockedRequests: Identify potential issues or attacks
 * - uniqueKeys: How many distinct clients/IPs/users
 */
export interface RateLimiterStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  uniqueKeys: number;
  requestsByAlgorithm: Record<RateLimitAlgorithm, {
    total: number;
    allowed: number;
    blocked: number;
  }>;
}

