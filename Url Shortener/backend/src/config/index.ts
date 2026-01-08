import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/urlshortener',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  rateLimit: {
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },
  
  url: {
    shortCodeLength: parseInt(process.env.SHORT_CODE_LENGTH || '7', 10),
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  },
  
  cache: {
    urlTtlSeconds: 3600, // 1 hour
  },
} as const;

