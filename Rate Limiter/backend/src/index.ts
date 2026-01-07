/**
 * =============================================================================
 * RATE LIMITER - MAIN SERVER APPLICATION
 * =============================================================================
 * 
 * 📚 WHAT IS THIS?
 * 
 * This is the main entry point for our rate limiter demonstration server.
 * It sets up an Express.js server with:
 * - Multiple endpoints to test different rate limiting algorithms
 * - A dashboard API for monitoring statistics
 * - CORS support for the frontend
 * 
 * 🚀 HOW TO RUN:
 * 
 * 1. Install dependencies: npm install
 * 2. Start server: npm run dev
 * 3. Server runs on http://localhost:3001
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { MemoryStore } from './storage';
import { createRateLimiterMiddleware, getStats, resetStats } from './middleware/rate-limiter';
import { rateLimitPresets, createConfig } from './config/rules';
import { RateLimitAlgorithm, RateLimitConfig } from './types';
import { useCases, UseCase } from './types/use-cases';

// Create Express application
const app = express();

// Port configuration
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARE SETUP
// ============================================================

// Enable CORS for frontend
// WHY? Frontend runs on different port (3000), needs CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================================
// CREATE RATE LIMITERS FOR DIFFERENT ALGORITHMS
// ============================================================

// Create a shared memory store for all rate limiters
// In production, you'd use RedisStore for distributed systems
const store = new MemoryStore();

/**
 * Create rate limiters for each algorithm
 * These will be used on different endpoints for testing
 */
const limiters = {
  tokenBucket: createRateLimiterMiddleware(store, createConfig({
    windowMs: 10000,          // 10 seconds
    maxRequests: 10,
    algorithm: 'TOKEN_BUCKET',
    bucketSize: 5,
    refillRate: 1,
    refillInterval: 1000,
    message: 'Token Bucket: Rate limit exceeded'
  })),

  leakingBucket: createRateLimiterMiddleware(store, createConfig({
    windowMs: 10000,
    maxRequests: 10,
    algorithm: 'LEAKING_BUCKET',
    queueSize: 5,
    processingRate: 1,
    message: 'Leaking Bucket: Rate limit exceeded'
  })),

  fixedWindow: createRateLimiterMiddleware(store, createConfig({
    windowMs: 10000,          // 10 second window
    maxRequests: 5,
    algorithm: 'FIXED_WINDOW',
    message: 'Fixed Window: Rate limit exceeded'
  })),

  slidingWindowLog: createRateLimiterMiddleware(store, createConfig({
    windowMs: 10000,
    maxRequests: 5,
    algorithm: 'SLIDING_WINDOW_LOG',
    message: 'Sliding Window Log: Rate limit exceeded'
  })),

  slidingWindowCounter: createRateLimiterMiddleware(store, createConfig({
    windowMs: 10000,
    maxRequests: 5,
    algorithm: 'SLIDING_WINDOW_COUNTER',
    message: 'Sliding Window Counter: Rate limit exceeded'
  }))
};

// ============================================================
// HEALTH CHECK ENDPOINT (No rate limiting)
// ============================================================

/**
 * GET /health
 * 
 * Health check endpoint for monitoring.
 * NOT rate limited - used by load balancers and monitoring.
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================
// STATISTICS ENDPOINT
// ============================================================

/**
 * GET /stats
 * 
 * Returns rate limiter statistics for the dashboard.
 * Shows total requests, allowed/blocked counts, etc.
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json(getStats());
});

/**
 * POST /stats/reset
 * 
 * Resets all statistics. Useful for testing.
 */
app.post('/stats/reset', async (req: Request, res: Response) => {
  resetStats();
  await store.reset();
  res.json({ message: 'Statistics reset' });
});

// ============================================================
// REAL-WORLD USE CASE ENDPOINTS
// ============================================================

/**
 * Create rate limiters for each real-world use case
 */
const useCaseLimiters: Record<string, ReturnType<typeof createRateLimiterMiddleware>> = {};

useCases.forEach(useCase => {
  useCaseLimiters[useCase.id] = createRateLimiterMiddleware(store, useCase.config);
});

/**
 * Generic use case endpoint handler
 */
const handleUseCase = (useCase: UseCase) => {
  return async (req: Request, res: Response) => {
    res.json({
      success: true,
      useCase: useCase.name,
      endpoint: useCase.endpoint,
      method: useCase.method,
      message: `Request to ${useCase.endpoint} processed successfully`,
      scenario: useCase.realWorldExample,
      timestamp: new Date().toISOString()
    });
  };
};

// Login endpoint - Security critical
app.post('/api/auth/login', useCaseLimiters.login, handleUseCase(useCases[0]));

// Payment endpoint - Money involved
app.post('/api/payments/process', useCaseLimiters.payment, handleUseCase(useCases[1]));

// Password reset - Security
app.post('/api/auth/reset-password', useCaseLimiters['password-reset'], handleUseCase(useCases[2]));

// API read - General usage
app.get('/api/users/profile', useCaseLimiters['api-read'], handleUseCase(useCases[3]));

// File upload - Storage limits
app.post('/api/files/upload', useCaseLimiters['file-upload'], handleUseCase(useCases[4]));

// Search - Cost control
app.get('/api/search', useCaseLimiters.search, handleUseCase(useCases[5]));

// Email sending - Daily quota
app.post('/api/emails/send', useCaseLimiters['email-send'], handleUseCase(useCases[6]));

// API write - Content creation
app.post('/api/posts/create', useCaseLimiters['api-write'], handleUseCase(useCases[7]));

// Burst traffic - Notifications
app.post('/api/notifications/push', useCaseLimiters['api-burst'], handleUseCase(useCases[8]));

// Background jobs - Constant rate
app.post('/api/jobs/submit', useCaseLimiters['background-job'], handleUseCase(useCases[9]));

// ============================================================
// RATE LIMITED TEST ENDPOINTS (Algorithm Testing)
// ============================================================

/**
 * GET /api/token-bucket
 * 
 * Tests the Token Bucket algorithm.
 * - Bucket size: 5 tokens
 * - Refill rate: 1 token per second
 * - Allows bursts up to 5 requests
 */
app.get('/api/token-bucket', limiters.tokenBucket, (req: Request, res: Response) => {
  res.json({
    success: true,
    algorithm: 'TOKEN_BUCKET',
    message: 'Request allowed!',
    timestamp: new Date().toISOString(),
    tip: 'Token Bucket allows bursts. Try sending 5 requests quickly, then wait.'
  });
});

/**
 * GET /api/leaking-bucket
 * 
 * Tests the Leaking Bucket algorithm.
 * - Queue size: 5 requests
 * - Processing rate: 1 request per second
 * - Smooths out traffic bursts
 */
app.get('/api/leaking-bucket', limiters.leakingBucket, (req: Request, res: Response) => {
  res.json({
    success: true,
    algorithm: 'LEAKING_BUCKET',
    message: 'Request allowed!',
    timestamp: new Date().toISOString(),
    tip: 'Leaking Bucket processes requests at a constant rate.'
  });
});

/**
 * GET /api/fixed-window
 * 
 * Tests the Fixed Window algorithm.
 * - Window: 10 seconds
 * - Max requests: 5 per window
 * - Resets at window boundaries
 */
app.get('/api/fixed-window', limiters.fixedWindow, (req: Request, res: Response) => {
  res.json({
    success: true,
    algorithm: 'FIXED_WINDOW',
    message: 'Request allowed!',
    timestamp: new Date().toISOString(),
    tip: 'Fixed Window resets at fixed intervals. Watch for the edge case!'
  });
});

/**
 * GET /api/sliding-window-log
 * 
 * Tests the Sliding Window Log algorithm.
 * - Window: 10 seconds
 * - Max requests: 5
 * - Most accurate, tracks every request timestamp
 */
app.get('/api/sliding-window-log', limiters.slidingWindowLog, (req: Request, res: Response) => {
  res.json({
    success: true,
    algorithm: 'SLIDING_WINDOW_LOG',
    message: 'Request allowed!',
    timestamp: new Date().toISOString(),
    tip: 'Sliding Window Log is the most accurate. No edge case problems!'
  });
});

/**
 * GET /api/sliding-window-counter
 * 
 * Tests the Sliding Window Counter algorithm.
 * - Window: 10 seconds
 * - Max requests: 5
 * - Best balance of accuracy and efficiency
 */
app.get('/api/sliding-window-counter', limiters.slidingWindowCounter, (req: Request, res: Response) => {
  res.json({
    success: true,
    algorithm: 'SLIDING_WINDOW_COUNTER',
    message: 'Request allowed!',
    timestamp: new Date().toISOString(),
    tip: 'Sliding Window Counter is memory efficient and accurate enough for most use cases.'
  });
});

// ============================================================
// DYNAMIC RATE LIMITER ENDPOINT
// ============================================================

/**
 * POST /api/test
 * 
 * Dynamic endpoint that applies rate limiting based on request body.
 * Allows the frontend to test any algorithm with custom settings.
 * 
 * Request body:
 * {
 *   algorithm: 'TOKEN_BUCKET' | 'LEAKING_BUCKET' | etc.
 *   windowMs: number
 *   maxRequests: number
 *   clientId: string (optional, for testing multiple clients)
 * }
 */
app.post('/api/test', async (req: Request, res: Response) => {
  try {
    const { 
      algorithm = 'SLIDING_WINDOW_COUNTER', 
      windowMs = 10000, 
      maxRequests = 5,
      clientId = 'default'
    } = req.body;

    // Validate algorithm
    const validAlgorithms: RateLimitAlgorithm[] = [
      'TOKEN_BUCKET', 
      'LEAKING_BUCKET', 
      'FIXED_WINDOW', 
      'SLIDING_WINDOW_LOG', 
      'SLIDING_WINDOW_COUNTER'
    ];

    if (!validAlgorithms.includes(algorithm)) {
      res.status(400).json({ error: 'Invalid algorithm' });
      return;
    }

    // Create a limiter with the specified config
    const config: RateLimitConfig = {
      windowMs,
      maxRequests,
      algorithm,
      bucketSize: maxRequests,
      refillRate: Math.max(1, Math.floor(maxRequests / (windowMs / 1000))),
      refillInterval: 1000,
      queueSize: maxRequests,
      processingRate: Math.max(1, Math.floor(maxRequests / (windowMs / 1000))),
      headers: true
    };

    // Get the appropriate rate limiter class
    const { TokenBucketRateLimiter } = await import('./algorithms/token-bucket');
    const { LeakingBucketRateLimiter } = await import('./algorithms/leaking-bucket');
    const { FixedWindowRateLimiter } = await import('./algorithms/fixed-window');
    const { SlidingWindowLogRateLimiter } = await import('./algorithms/sliding-window-log');
    const { SlidingWindowCounterRateLimiter } = await import('./algorithms/sliding-window-counter');

    let limiter;
    switch (algorithm) {
      case 'TOKEN_BUCKET':
        limiter = new TokenBucketRateLimiter(store, config);
        break;
      case 'LEAKING_BUCKET':
        limiter = new LeakingBucketRateLimiter(store, config);
        break;
      case 'FIXED_WINDOW':
        limiter = new FixedWindowRateLimiter(store, config);
        break;
      case 'SLIDING_WINDOW_LOG':
        limiter = new SlidingWindowLogRateLimiter(store, config);
        break;
      case 'SLIDING_WINDOW_COUNTER':
        limiter = new SlidingWindowCounterRateLimiter(store, config);
        break;
    }

    // Check rate limit using clientId as the key
    const key = `test:${algorithm}:${clientId}`;
    const result = await limiter!.checkLimit(key);

    // Set headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    // Get algorithm explanation
    const getAlgorithmExplanation = (algo: string, result: any) => {
      const explanations: Record<string, (r: any) => string> = {
        TOKEN_BUCKET: (r) => {
          const used = r.limit - r.remaining;
          return `Token Bucket: ${used} token(s) consumed. ${r.remaining} token(s) remaining. Tokens refill at a constant rate, allowing burst traffic when tokens are available.`;
        },
        LEAKING_BUCKET: (r) => {
          const queueSize = r.currentCount || 0;
          return `Leaking Bucket: Request added to queue (${queueSize}/${r.limit}). Requests are processed at a constant rate (1 per second), ensuring smooth traffic flow.`;
        },
        FIXED_WINDOW: (r) => {
          const used = r.limit - r.remaining;
          return `Fixed Window: ${used} request(s) in current window (${r.limit} max). Counter resets at window boundary. Note: Edge case allows 2x limit at boundaries!`;
        },
        SLIDING_WINDOW_LOG: (r) => {
          const used = r.currentCount || 0;
          return `Sliding Window Log: ${used} request(s) in rolling window. Every request timestamp is tracked for perfect accuracy. Most precise algorithm!`;
        },
        SLIDING_WINDOW_COUNTER: (r) => {
          const used = r.currentCount || 0;
          return `Sliding Window Counter: Estimated ${used} request(s) using weighted average. Combines current and previous window counts. 99.997% accurate!`;
        }
      };
      return explanations[algo]?.(result) || 'Rate limit check completed.';
    };

    const explanation = getAlgorithmExplanation(algorithm, result);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter || 1);
      res.status(429).json({
        success: false,
        algorithm,
        error: 'Rate limit exceeded',
        explanation,
        ...result
      });
      return;
    }

    res.json({
      success: true,
      algorithm,
      message: 'Request allowed!',
      explanation,
      ...result
    });

  } catch (error) {
    console.error('Error in /api/test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// ALGORITHM INFO ENDPOINT
// ============================================================

/**
 * GET /api/use-cases
 * 
 * Returns all real-world use cases with their configurations.
 */
app.get('/api/use-cases', (req: Request, res: Response) => {
  res.json({
    useCases: useCases.map(uc => ({
      id: uc.id,
      name: uc.name,
      description: uc.description,
      endpoint: uc.endpoint,
      method: uc.method,
      icon: uc.icon,
      color: uc.color,
      realWorldExample: uc.realWorldExample,
      whyThisLimit: uc.whyThisLimit,
      whatHappensWhenBlocked: uc.whatHappensWhenBlocked,
      companiesUsing: uc.companiesUsing,
      config: {
        windowMs: uc.config.windowMs,
        maxRequests: uc.config.maxRequests,
        algorithm: uc.config.algorithm
      }
    }))
  });
});

/**
 * GET /api/algorithms
 * 
 * Returns information about all available algorithms.
 * Useful for the frontend to display descriptions.
 */
app.get('/api/algorithms', (req: Request, res: Response) => {
  res.json({
    algorithms: [
      {
        id: 'TOKEN_BUCKET',
        name: 'Token Bucket',
        description: 'Allows burst traffic by accumulating tokens over time. Great for APIs that need to handle sudden spikes.',
        usedBy: ['Amazon AWS', 'Stripe', 'Twitter'],
        pros: ['Allows bursts', 'Memory efficient', 'Simple'],
        cons: ['Bursts might overwhelm downstream services', 'Two parameters to tune']
      },
      {
        id: 'LEAKING_BUCKET',
        name: 'Leaking Bucket',
        description: 'Processes requests at a constant rate, smoothing out traffic spikes. Like a queue with a speed limit.',
        usedBy: ['Shopify', 'NGINX'],
        pros: ['Constant output rate', 'FIFO fairness', 'Memory efficient'],
        cons: ['No burst allowance', 'May delay recent requests']
      },
      {
        id: 'FIXED_WINDOW',
        name: 'Fixed Window',
        description: 'Divides time into fixed windows and counts requests per window. Simple but has edge case issues.',
        usedBy: ['Simple APIs', 'Internal services'],
        pros: ['Very simple', 'Memory efficient', 'Easy to understand'],
        cons: ['Edge case: 2x requests possible at window boundary']
      },
      {
        id: 'SLIDING_WINDOW_LOG',
        name: 'Sliding Window Log',
        description: 'Tracks every request timestamp for perfect accuracy. Best for security-critical operations.',
        usedBy: ['Login limiting', 'Payment APIs', 'Security features'],
        pros: ['Perfect accuracy', 'No edge cases'],
        cons: ['High memory usage', 'Stores every timestamp']
      },
      {
        id: 'SLIDING_WINDOW_COUNTER',
        name: 'Sliding Window Counter',
        description: 'Hybrid approach using weighted averages. Best balance of accuracy and efficiency.',
        usedBy: ['Cloudflare', 'High-traffic APIs'],
        pros: ['Memory efficient', 'Good accuracy (99.997%)', 'Smooth limiting'],
        cons: ['Approximation', 'Slightly complex']
      }
    ]
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚦 RATE LIMITER SERVER                                       ║
║                                                                ║
║   Server running on: http://localhost:${PORT}                    ║
║                                                                ║
║   Endpoints:                                                   ║
║   ├── GET  /health                    - Health check           ║
║   ├── GET  /stats                     - Get statistics         ║
║   ├── POST /stats/reset               - Reset statistics       ║
║   ├── GET  /api/token-bucket          - Test Token Bucket      ║
║   ├── GET  /api/leaking-bucket        - Test Leaking Bucket    ║
║   ├── GET  /api/fixed-window          - Test Fixed Window      ║
║   ├── GET  /api/sliding-window-log    - Test Sliding Window Log║
║   ├── GET  /api/sliding-window-counter- Test Sliding Window Cnt║
║   ├── POST /api/test                  - Dynamic testing        ║
║   └── GET  /api/algorithms            - Algorithm info         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

