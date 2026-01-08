import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { checkDatabaseConnection } from './db/pool.js';
import { checkRedisConnection } from './cache/redis.js';
import urlRoutes from './routes/urlRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import authRoutes from './routes/authRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Trust proxy for rate limiting (for getting real IP behind reverse proxy)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
    },
  });
});

// API routes
app.use('/api', urlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', qrRoutes);

// Redirect routes (must be last to avoid conflicts)
app.use('/', redirectRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  console.log('Starting URL Shortener API...');
  
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  console.log('Database connected');

  // Check Redis connection
  const redisConnected = await checkRedisConnection();
  if (!redisConnected) {
    console.warn('Redis connection failed. Caching will be disabled.');
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Base URL: ${config.url.baseUrl}`);
  });
}

start().catch(console.error);

