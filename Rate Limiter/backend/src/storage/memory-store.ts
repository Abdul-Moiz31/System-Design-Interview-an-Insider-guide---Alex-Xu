/**
 * =============================================================================
 * IN-MEMORY STORAGE FOR RATE LIMITER
 * =============================================================================
 * 
 * 📚 WHAT IS THIS?
 * 
 * An in-memory implementation of the RateLimitStore interface. It stores all
 * rate limiting data in JavaScript objects/Maps, making it fast but NOT
 * suitable for distributed systems.
 * 
 * 🎯 WHEN TO USE:
 * - Development and testing
 * - Single-server deployments
 * - Low-traffic applications
 * - When Redis isn't available or needed
 * 
 * ❌ WHEN NOT TO USE:
 * - Distributed systems (data won't sync across servers)
 * - High-availability requirements (data lost on restart)
 * - Memory-constrained environments (everything in RAM)
 * 
 * 🆚 WHY NOT JUST USE A PLAIN OBJECT?
 * - Map is more performant for frequent additions/deletions
 * - We need TTL (time-to-live) functionality
 * - Clean separation of concerns
 * 
 * 💡 PRODUCTION NOTE:
 * In production, you'd use RedisStore instead. This MemoryStore is great
 * for understanding how the system works and for local development.
 */

import { RateLimitStore, TokenBucketState, LeakingBucketState } from '../types';

interface StoredValue<T> {
  value: T;
  expiresAt: number;  // Unix timestamp in milliseconds
}

export class MemoryStore implements RateLimitStore {
  // Main storage for counters (used by Fixed Window, Sliding Window Counter)
  // WHY Map? O(1) lookup, better performance than plain objects for frequent operations
  private counters: Map<string, StoredValue<number>> = new Map();
  
  // Storage for timestamps (used by Sliding Window Log)
  // We use an array of timestamps for each key
  private timestamps: Map<string, StoredValue<number[]>> = new Map();
  
  // Storage for Token Bucket states
  private bucketStates: Map<string, StoredValue<TokenBucketState>> = new Map();
  
  // Storage for Leaking Bucket queues
  private queueStates: Map<string, StoredValue<LeakingBucketState>> = new Map();

  // Cleanup interval reference (to prevent memory leaks)
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of expired entries
    // WHY? Without cleanup, memory would grow unbounded
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   * 
   * WHY NEEDED?
   * Unlike Redis which has built-in expiration, we need to manually
   * clean up expired entries. Otherwise memory would keep growing.
   * 
   * We run cleanup every 60 seconds as a balance between:
   * - Memory efficiency (more frequent = cleaner)
   * - CPU usage (less frequent = less overhead)
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every 60 seconds
  }

  /**
   * Remove all expired entries from storage
   */
  private cleanupExpired(): void {
    const now = Date.now();

    // Helper function to clean a map
    const cleanMap = <T>(map: Map<string, StoredValue<T>>) => {
      for (const [key, stored] of map.entries()) {
        if (stored.expiresAt <= now) {
          map.delete(key);
        }
      }
    };

    cleanMap(this.counters);
    cleanMap(this.timestamps);
    cleanMap(this.bucketStates);
    cleanMap(this.queueStates);
  }

  /**
   * Check if a stored value has expired
   */
  private isExpired(stored: StoredValue<any>): boolean {
    return stored.expiresAt <= Date.now();
  }

  /**
   * Increment a counter and return the new value
   * This is the core operation for Fixed Window and Sliding Window Counter
   * 
   * @param key - Unique identifier
   * @param windowMs - How long this counter should live
   * @returns The new counter value after incrementing
   */
  async increment(key: string, windowMs: number): Promise<number> {
    const stored = this.counters.get(key);
    const now = Date.now();

    if (!stored || this.isExpired(stored)) {
      // Key doesn't exist or has expired, start fresh at 1
      this.counters.set(key, {
        value: 1,
        expiresAt: now + windowMs
      });
      return 1;
    }

    // Increment existing counter
    stored.value += 1;
    return stored.value;
  }

  /**
   * Get the current value of a counter
   */
  async get(key: string): Promise<number | null> {
    const stored = this.counters.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return null;
    }

    return stored.value;
  }

  /**
   * Set a counter to a specific value
   */
  async set(key: string, value: number, windowMs: number): Promise<void> {
    this.counters.set(key, {
      value,
      expiresAt: Date.now() + windowMs
    });
  }

  /**
   * Delete a key from storage
   */
  async delete(key: string): Promise<void> {
    this.counters.delete(key);
    this.timestamps.delete(key);
    this.bucketStates.delete(key);
    this.queueStates.delete(key);
  }

  /**
   * Get remaining time-to-live for a key
   */
  async getTTL(key: string): Promise<number> {
    const stored = this.counters.get(key) || 
                   this.timestamps.get(key) || 
                   this.bucketStates.get(key) || 
                   this.queueStates.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return 0;
    }

    return stored.expiresAt - Date.now();
  }

  // ============================================================
  // SLIDING WINDOW LOG OPERATIONS
  // ============================================================

  /**
   * Add a timestamp to the log
   * Used by Sliding Window Log algorithm
   */
  async addTimestamp(key: string, timestamp: number, windowMs: number): Promise<void> {
    const stored = this.timestamps.get(key);
    const now = Date.now();

    if (!stored || this.isExpired(stored)) {
      // Create new timestamp list
      this.timestamps.set(key, {
        value: [timestamp],
        expiresAt: now + windowMs
      });
    } else {
      // Add to existing list
      stored.value.push(timestamp);
      // Update expiration
      stored.expiresAt = now + windowMs;
    }
  }

  /**
   * Get all timestamps after a given time
   * Used by Sliding Window Log to count requests in the current window
   */
  async getTimestamps(key: string, minTimestamp: number): Promise<number[]> {
    const stored = this.timestamps.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return [];
    }

    // Filter to only include timestamps within the window
    return stored.value.filter(ts => ts >= minTimestamp);
  }

  /**
   * Remove timestamps older than a given time
   * Used by Sliding Window Log to clean up old entries
   */
  async removeOldTimestamps(key: string, minTimestamp: number): Promise<void> {
    const stored = this.timestamps.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return;
    }

    // Keep only timestamps that are >= minTimestamp
    stored.value = stored.value.filter(ts => ts >= minTimestamp);
  }

  // ============================================================
  // TOKEN BUCKET OPERATIONS
  // ============================================================

  /**
   * Get the current state of a token bucket
   */
  async getBucketState(key: string): Promise<TokenBucketState | null> {
    const stored = this.bucketStates.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return null;
    }

    return stored.value;
  }

  /**
   * Set the state of a token bucket
   */
  async setBucketState(key: string, state: TokenBucketState, ttlMs: number): Promise<void> {
    this.bucketStates.set(key, {
      value: state,
      expiresAt: Date.now() + ttlMs
    });
  }

  // ============================================================
  // LEAKING BUCKET OPERATIONS
  // ============================================================

  /**
   * Get the current state of a leaking bucket queue
   */
  async getQueue(key: string): Promise<LeakingBucketState | null> {
    const stored = this.queueStates.get(key);
    
    if (!stored || this.isExpired(stored)) {
      return null;
    }

    return stored.value;
  }

  /**
   * Set the state of a leaking bucket queue
   */
  async setQueue(key: string, state: LeakingBucketState, ttlMs: number): Promise<void> {
    this.queueStates.set(key, {
      value: state,
      expiresAt: Date.now() + ttlMs
    });
  }

  // ============================================================
  // UTILITY OPERATIONS
  // ============================================================

  /**
   * Reset all data (useful for testing)
   */
  async reset(): Promise<void> {
    this.counters.clear();
    this.timestamps.clear();
    this.bucketStates.clear();
    this.queueStates.clear();
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get statistics about storage (for monitoring)
   */
  getStats(): { counters: number; timestamps: number; buckets: number; queues: number } {
    return {
      counters: this.counters.size,
      timestamps: this.timestamps.size,
      buckets: this.bucketStates.size,
      queues: this.queueStates.size
    };
  }
}

