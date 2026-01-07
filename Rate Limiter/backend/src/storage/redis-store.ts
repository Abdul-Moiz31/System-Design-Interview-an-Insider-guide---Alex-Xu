/**
 * =============================================================================
 * REDIS STORAGE FOR RATE LIMITER (DISTRIBUTED SYSTEMS)
 * =============================================================================
 * 
 * 📚 WHAT IS THIS?
 * 
 * A Redis-based implementation of the RateLimitStore interface. This enables
 * rate limiting across multiple servers, which is essential for:
 * - Microservices architecture
 * - Load-balanced applications
 * - Horizontally scaled systems
 * 
 * 🎯 WHY REDIS FOR RATE LIMITING?
 * 
 * 1. SPEED: Redis is incredibly fast (sub-millisecond operations)
 *    - All data in memory
 *    - Single-threaded = no lock contention
 * 
 * 2. ATOMIC OPERATIONS: Redis commands are atomic
 *    - INCR: Increment counter atomically
 *    - ZADD: Add to sorted set atomically
 *    - Prevents race conditions!
 * 
 * 3. BUILT-IN TTL: Keys expire automatically
 *    - No manual cleanup needed
 *    - Perfect for time-window based limiting
 * 
 * 4. DATA STRUCTURES: Rich data types
 *    - Strings: For counters
 *    - Sorted Sets: For sliding window log (timestamps)
 *    - Hashes: For complex state (token bucket)
 * 
 * 5. DISTRIBUTED: Works across multiple servers
 *    - All servers share the same Redis instance
 *    - Consistent rate limiting regardless of which server handles the request
 * 
 * 🔧 REDIS COMMANDS USED:
 * 
 * - INCR key: Atomically increment counter
 * - EXPIRE key seconds: Set TTL on a key
 * - GET key: Get value
 * - SET key value EX seconds: Set with expiration
 * - ZADD key score member: Add to sorted set
 * - ZREMRANGEBYSCORE key min max: Remove by score range
 * - ZRANGEBYSCORE key min max: Get by score range
 * - ZCARD key: Count elements in sorted set
 * 
 * 💡 PRODUCTION CONSIDERATIONS:
 * 
 * 1. CONNECTION POOLING: Redis clients should pool connections
 * 2. FAILOVER: Use Redis Sentinel or Cluster for HA
 * 3. PERSISTENCE: Consider RDB/AOF for durability (usually not needed for rate limiting)
 * 4. MEMORY: Monitor memory usage, especially with Sliding Window Log
 */

import { RateLimitStore, TokenBucketState, LeakingBucketState } from '../types';
import Redis from 'ioredis';

export class RedisStore implements RateLimitStore {
  private client: Redis;
  private prefix: string;

  /**
   * Create a new Redis store
   * 
   * @param redisUrl - Redis connection URL (e.g., redis://localhost:6379)
   * @param prefix - Key prefix to avoid collisions with other apps
   */
  constructor(redisUrl: string = 'redis://localhost:6379', prefix: string = 'rl:') {
    this.client = new Redis(redisUrl, {
      // Reconnect on connection loss
      retryStrategy: (times) => {
        // Exponential backoff with max 30 second delay
        return Math.min(times * 50, 30000);
      },
      // Connection timeout
      connectTimeout: 10000,
      // Keep alive
      keepAlive: 30000,
    });

    this.prefix = prefix;

    // Handle connection events
    this.client.on('connect', () => {
      console.log('📦 Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }

  /**
   * Generate a prefixed key
   * WHY prefix? Prevents collisions with other apps using the same Redis
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // ============================================================
  // COUNTER OPERATIONS (Fixed Window, Sliding Window Counter)
  // ============================================================

  /**
   * Atomically increment a counter
   * 
   * This uses Redis INCR which is atomic - even with concurrent requests,
   * each will get a unique incremented value.
   * 
   * WHY INCR?
   * - Atomic: No race conditions
   * - Fast: Single round-trip to Redis
   * - Creates key if it doesn't exist (starts at 1)
   */
  async increment(key: string, windowMs: number): Promise<number> {
    const redisKey = this.getKey(key);
    
    // Use a transaction (MULTI/EXEC) to ensure atomicity
    // This runs INCR and PEXPIRE as a single atomic operation
    const results = await this.client
      .multi()
      .incr(redisKey)
      .pexpire(redisKey, windowMs) // PEXPIRE uses milliseconds
      .exec();

    // Results is [[null, value], [null, 1]] for successful operations
    if (results && results[0] && results[0][1] !== null) {
      return results[0][1] as number;
    }

    // Fallback to simple INCR if transaction failed
    return await this.client.incr(redisKey);
  }

  /**
   * Get the current value of a counter
   */
  async get(key: string): Promise<number | null> {
    const value = await this.client.get(this.getKey(key));
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Set a counter value
   */
  async set(key: string, value: number, windowMs: number): Promise<void> {
    await this.client.set(this.getKey(key), value.toString(), 'PX', windowMs);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    const redisKey = this.getKey(key);
    await this.client.del(
      redisKey,
      `${redisKey}:ts`,      // Timestamp key
      `${redisKey}:bucket`,  // Bucket state key
      `${redisKey}:queue`    // Queue state key
    );
  }

  /**
   * Get remaining TTL in milliseconds
   */
  async getTTL(key: string): Promise<number> {
    const ttl = await this.client.pttl(this.getKey(key));
    return ttl > 0 ? ttl : 0;
  }

  // ============================================================
  // SLIDING WINDOW LOG OPERATIONS (using Redis Sorted Sets)
  // ============================================================

  /**
   * Add a timestamp to the sorted set
   * 
   * WHY SORTED SET?
   * - Score-based ordering (we use timestamp as score)
   * - O(log N) insertion
   * - Easy range queries (get all timestamps in a window)
   * - Easy cleanup (remove by score range)
   */
  async addTimestamp(key: string, timestamp: number, windowMs: number): Promise<void> {
    const redisKey = `${this.getKey(key)}:ts`;
    
    // ZADD adds to sorted set with timestamp as both score and member
    // This creates a log of all request timestamps
    await this.client
      .multi()
      .zadd(redisKey, timestamp, timestamp.toString())
      .pexpire(redisKey, windowMs)
      .exec();
  }

  /**
   * Get all timestamps >= minTimestamp
   * 
   * This efficiently queries the sorted set for all requests
   * within the current sliding window.
   */
  async getTimestamps(key: string, minTimestamp: number): Promise<number[]> {
    const redisKey = `${this.getKey(key)}:ts`;
    
    // ZRANGEBYSCORE gets all members with score >= minTimestamp
    // '+inf' means no upper bound
    const results = await this.client.zrangebyscore(
      redisKey,
      minTimestamp,
      '+inf'
    );

    return results.map(ts => parseInt(ts, 10));
  }

  /**
   * Remove all timestamps < minTimestamp
   * 
   * This cleans up old timestamps that are outside the current window.
   * Essential to prevent unbounded memory growth.
   */
  async removeOldTimestamps(key: string, minTimestamp: number): Promise<void> {
    const redisKey = `${this.getKey(key)}:ts`;
    
    // ZREMRANGEBYSCORE removes all members with score < minTimestamp
    // '-inf' means no lower bound
    await this.client.zremrangebyscore(redisKey, '-inf', minTimestamp - 1);
  }

  // ============================================================
  // TOKEN BUCKET OPERATIONS (using Redis Hashes)
  // ============================================================

  /**
   * Get token bucket state
   * 
   * WHY HASH?
   * - Multiple fields in one key (tokens, lastRefillTime)
   * - Atomic HGET/HSET operations
   * - Memory efficient for structured data
   */
  async getBucketState(key: string): Promise<TokenBucketState | null> {
    const redisKey = `${this.getKey(key)}:bucket`;
    
    const state = await this.client.hgetall(redisKey);
    
    if (!state || Object.keys(state).length === 0) {
      return null;
    }

    return {
      tokens: parseFloat(state.tokens),
      lastRefillTime: parseInt(state.lastRefillTime, 10)
    };
  }

  /**
   * Set token bucket state
   */
  async setBucketState(key: string, state: TokenBucketState, ttlMs: number): Promise<void> {
    const redisKey = `${this.getKey(key)}:bucket`;
    
    await this.client
      .multi()
      .hset(redisKey, 'tokens', state.tokens.toString())
      .hset(redisKey, 'lastRefillTime', state.lastRefillTime.toString())
      .pexpire(redisKey, ttlMs)
      .exec();
  }

  // ============================================================
  // LEAKING BUCKET OPERATIONS (using Redis Lists)
  // ============================================================

  /**
   * Get leaking bucket queue state
   * 
   * We store this as a JSON string for simplicity.
   * In high-performance scenarios, you might use Redis Lists (LPUSH/RPOP)
   * for the queue and a separate key for lastLeakTime.
   */
  async getQueue(key: string): Promise<LeakingBucketState | null> {
    const redisKey = `${this.getKey(key)}:queue`;
    
    const data = await this.client.get(redisKey);
    
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Set leaking bucket queue state
   */
  async setQueue(key: string, state: LeakingBucketState, ttlMs: number): Promise<void> {
    const redisKey = `${this.getKey(key)}:queue`;
    
    await this.client.set(redisKey, JSON.stringify(state), 'PX', ttlMs);
  }

  // ============================================================
  // UTILITY OPERATIONS
  // ============================================================

  /**
   * Reset all rate limiting data
   * 
   * WARNING: This uses KEYS which can be slow on large datasets.
   * In production, consider using SCAN instead for large keyspaces.
   */
  async reset(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}*`);
    
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client.status === 'ready';
  }
}

/**
 * =============================================================================
 * RACE CONDITION HANDLING IN REDIS
 * =============================================================================
 * 
 * 🚨 THE PROBLEM:
 * 
 * In a distributed system with high concurrency, we might have:
 * 
 *   Server A                    Server B
 *      │                           │
 *      │ 1. GET counter (= 99)     │ 1. GET counter (= 99)
 *      │                           │
 *      │ 2. Check: 99 < 100? YES   │ 2. Check: 99 < 100? YES
 *      │                           │
 *      │ 3. SET counter = 100      │ 3. SET counter = 100
 *      │                           │
 *      ▼                           ▼
 *   Both requests allowed, but counter is only 100!
 *   (Should be 101, both should NOT have been allowed)
 * 
 * 🔧 THE SOLUTIONS:
 * 
 * 1. ATOMIC INCR (What we use)
 *    - Redis INCR is atomic
 *    - No GET-then-SET race condition
 *    - Each request gets a unique counter value
 * 
 *   Server A                    Server B
 *      │                           │
 *      │ INCR counter → 100        │ INCR counter → 101
 *      │                           │
 *      │ 100 <= 100? YES ✓         │ 101 <= 100? NO ✗
 *      │                           │
 *      ▼                           ▼
 *   Request allowed            Request rejected
 * 
 * 2. LUA SCRIPTS (For complex logic)
 *    - When you need to read-modify-write atomically
 *    - Runs on Redis server, no network round-trips in between
 *    - Example: Token bucket refill + consume in one operation
 * 
 *   -- Example Lua script for token bucket
 *   local tokens = redis.call('GET', KEYS[1]) or ARGV[1]
 *   local lastRefill = redis.call('GET', KEYS[2]) or ARGV[2]
 *   -- ... refill logic ...
 *   if tokens >= 1 then
 *     tokens = tokens - 1
 *     redis.call('SET', KEYS[1], tokens)
 *     return 1  -- allowed
 *   end
 *   return 0  -- rejected
 * 
 * 3. REDIS TRANSACTIONS (MULTI/EXEC)
 *    - Groups commands into a single operation
 *    - Not truly atomic (commands still execute sequentially)
 *    - Good for related operations that must all succeed
 * 
 * =============================================================================
 */

