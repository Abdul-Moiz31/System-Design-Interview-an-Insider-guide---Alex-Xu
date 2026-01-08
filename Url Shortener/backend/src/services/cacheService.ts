import { redis, cacheKeys } from '../cache/redis.js';
import { config } from '../config/index.js';

export interface CachedUrl {
  originalUrl: string;
  expiresAt: string | null;
}

export const cacheService = {
  /**
   * Cache a URL mapping
   */
  async setUrl(shortCode: string, originalUrl: string, expiresAt: Date | null): Promise<void> {
    const key = cacheKeys.url(shortCode);
    const data: CachedUrl = {
      originalUrl,
      expiresAt: expiresAt?.toISOString() || null,
    };
    
    await redis.setex(key, config.cache.urlTtlSeconds, JSON.stringify(data));
  },

  /**
   * Get cached URL mapping
   */
  async getUrl(shortCode: string): Promise<CachedUrl | null> {
    const key = cacheKeys.url(shortCode);
    const data = await redis.get(key);
    
    if (!data) return null;
    
    const cached: CachedUrl = JSON.parse(data);
    
    // Check if URL has expired
    if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
      await this.deleteUrl(shortCode);
      return null;
    }
    
    return cached;
  },

  /**
   * Delete cached URL
   */
  async deleteUrl(shortCode: string): Promise<void> {
    const key = cacheKeys.url(shortCode);
    await redis.del(key);
  },

  /**
   * Check cache health
   */
  async isHealthy(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  },
};

