import Redis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.connect();
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Cache keys
export const cacheKeys = {
  url: (shortCode: string) => `url:${shortCode}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
};

