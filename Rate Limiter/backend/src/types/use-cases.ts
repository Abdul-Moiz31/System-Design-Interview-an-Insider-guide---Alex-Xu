/**
 * =============================================================================
 * REAL-WORLD USE CASES FOR RATE LIMITING
 * =============================================================================
 * 
 * This file defines real-world scenarios where rate limiting is critical.
 * Each use case has:
 * - A specific API endpoint
 * - Appropriate rate limits
 * - The best algorithm for that use case
 * - Real-world context and explanation
 */

import { RateLimitConfig, RateLimitAlgorithm } from './index';

export interface UseCase {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  icon: string;
  color: string;
  config: RateLimitConfig;
  realWorldExample: string;
  whyThisLimit: string;
  whatHappensWhenBlocked: string;
  companiesUsing: string[];
}

export const useCases: UseCase[] = [
  {
    id: 'login',
    name: 'Login Attempts',
    description: 'Prevent brute force attacks on user authentication',
    endpoint: '/api/auth/login',
    method: 'POST',
    icon: '🔐',
    color: 'rose',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // Only 5 login attempts per 15 minutes
      algorithm: 'SLIDING_WINDOW_LOG', // Most accurate for security
      message: 'Too many login attempts. Please try again in 15 minutes.',
      headers: true
    },
    realWorldExample: 'A user trying to guess passwords. After 5 failed attempts, they must wait.',
    whyThisLimit: 'Security critical - prevents brute force attacks. Need exact counting.',
    whatHappensWhenBlocked: 'User must wait 15 minutes or contact support to unlock account.',
    companiesUsing: ['GitHub', 'Google', 'Microsoft', 'Banking Apps']
  },
  {
    id: 'payment',
    name: 'Payment Processing',
    description: 'Protect payment endpoints from abuse and fraud',
    endpoint: '/api/payments/process',
    method: 'POST',
    icon: '💳',
    color: 'rose',
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3, // Only 3 payment attempts per minute
      algorithm: 'SLIDING_WINDOW_LOG', // Perfect accuracy for money
      message: 'Too many payment attempts. Please wait before trying again.',
      headers: true
    },
    realWorldExample: 'Preventing duplicate charges or payment fraud attempts.',
    whyThisLimit: 'Money involved - need perfect accuracy. Can\'t allow even one extra request.',
    whatHappensWhenBlocked: 'Payment is blocked. User must wait 1 minute before retrying.',
    companiesUsing: ['Stripe', 'PayPal', 'Square', 'Venmo']
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Limit password reset requests to prevent account takeover',
    endpoint: '/api/auth/reset-password',
    method: 'POST',
    icon: '🔑',
    color: 'rose',
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // Only 3 password resets per hour
      algorithm: 'SLIDING_WINDOW_LOG',
      message: 'Too many password reset requests. Please try again later.',
      headers: true
    },
    realWorldExample: 'Preventing attackers from spamming password reset emails.',
    whyThisLimit: 'Security feature - prevents account hijacking attempts.',
    whatHappensWhenBlocked: 'Password reset email won\'t be sent. User must wait 1 hour.',
    companiesUsing: ['All Major Platforms']
  },
  {
    id: 'api-read',
    name: 'API Read Operations',
    description: 'General API read requests - moderate limits',
    endpoint: '/api/users/profile',
    method: 'GET',
    icon: '📖',
    color: 'cyan',
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      algorithm: 'SLIDING_WINDOW_COUNTER', // Good balance
      message: 'API rate limit exceeded. Please slow down your requests.',
      headers: true
    },
    realWorldExample: 'A mobile app fetching user profile data. Normal usage is fine, but bots are blocked.',
    whyThisLimit: 'Allows normal usage but prevents abuse. Memory efficient for high volume.',
    whatHappensWhenBlocked: 'API returns 429. Client should implement exponential backoff.',
    companiesUsing: ['Twitter API', 'GitHub API', 'Reddit API']
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Limit file uploads to prevent storage abuse',
    endpoint: '/api/files/upload',
    method: 'POST',
    icon: '📤',
    color: 'amber',
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 uploads per hour
      algorithm: 'FIXED_WINDOW', // Simple for long windows
      message: 'Upload limit reached. Please try again in an hour.',
      headers: true
    },
    realWorldExample: 'Preventing users from uploading too many files and filling storage.',
    whyThisLimit: 'Storage costs money. Need to limit upload frequency.',
    whatHappensWhenBlocked: 'Upload is rejected. User must wait until next hour.',
    companiesUsing: ['Google Drive', 'Dropbox', 'Cloud Storage Services']
  },
  {
    id: 'search',
    name: 'Search API',
    description: 'Rate limit search queries to control costs',
    endpoint: '/api/search',
    method: 'GET',
    icon: '🔍',
    color: 'lime',
    config: {
      windowMs: 10 * 1000, // 10 seconds
      maxRequests: 20, // 20 searches per 10 seconds
      algorithm: 'TOKEN_BUCKET', // Allows search bursts
      bucketSize: 20,
      refillRate: 2, // 2 tokens per second
      refillInterval: 1000,
      message: 'Too many search requests. Please wait a moment.',
      headers: true
    },
    realWorldExample: 'User typing in search box - each keystroke triggers a search. Need to allow bursts.',
    whyThisLimit: 'Search is expensive (database queries). Allow bursts but limit average rate.',
    whatHappensWhenBlocked: 'Search request is queued or user sees "Please wait" message.',
    companiesUsing: ['Google', 'Elasticsearch', 'Algolia']
  },
  {
    id: 'email-send',
    name: 'Email Sending',
    description: 'Limit email sending to prevent spam',
    endpoint: '/api/emails/send',
    method: 'POST',
    icon: '📧',
    color: 'amber',
    config: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 100, // 100 emails per day
      algorithm: 'FIXED_WINDOW', // Simple daily limit
      message: 'Daily email limit reached. Limit resets at midnight.',
      headers: true
    },
    realWorldExample: 'Preventing users from sending spam emails or marketing blasts.',
    whyThisLimit: 'Email services charge per email. Need daily quotas.',
    whatHappensWhenBlocked: 'Email is not sent. User must wait until next day.',
    companiesUsing: ['SendGrid', 'Mailgun', 'AWS SES']
  },
  {
    id: 'api-write',
    name: 'API Write Operations',
    description: 'Limit write operations to prevent data abuse',
    endpoint: '/api/posts/create',
    method: 'POST',
    icon: '✍️',
    color: 'violet',
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 posts per minute
      algorithm: 'TOKEN_BUCKET', // Allows burst of posts
      bucketSize: 10,
      refillRate: 1, // 1 token per second
      refillInterval: 1000,
      message: 'Too many posts. Please slow down.',
      headers: true
    },
    realWorldExample: 'Social media posting - user can post multiple times quickly, but not spam.',
    whyThisLimit: 'Allows natural posting bursts but prevents spam. Good for user experience.',
    whatHappensWhenBlocked: 'Post is rejected. User must wait a few seconds before posting again.',
    companiesUsing: ['Twitter', 'Facebook', 'Instagram', 'Reddit']
  },
  {
    id: 'api-burst',
    name: 'Burst Traffic API',
    description: 'API that needs to handle traffic spikes',
    endpoint: '/api/notifications/push',
    method: 'POST',
    icon: '🔔',
    color: 'violet',
    config: {
      windowMs: 10 * 1000, // 10 seconds
      maxRequests: 50, // 50 requests per 10 seconds
      algorithm: 'TOKEN_BUCKET', // Perfect for bursts
      bucketSize: 50,
      refillRate: 5, // 5 tokens per second
      refillInterval: 1000,
      message: 'Rate limit exceeded. Please reduce request frequency.',
      headers: true
    },
    realWorldExample: 'Push notifications during a live event - sudden spike in traffic.',
    whyThisLimit: 'Need to handle legitimate bursts (events, announcements) but prevent abuse.',
    whatHappensWhenBlocked: 'Notification is queued or dropped. System continues processing.',
    companiesUsing: ['Firebase', 'OneSignal', 'Pusher']
  },
  {
    id: 'background-job',
    name: 'Background Job Queue',
    description: 'Process background jobs at constant rate',
    endpoint: '/api/jobs/submit',
    method: 'POST',
    icon: '⚙️',
    color: 'cyan',
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 jobs per minute = 1 per second
      algorithm: 'LEAKING_BUCKET', // Constant processing rate
      queueSize: 10,
      processingRate: 1, // 1 job per second
      message: 'Job queue is full. Please try again in a moment.',
      headers: true
    },
    realWorldExample: 'Video processing, image resizing - need constant rate to avoid overwhelming servers.',
    whyThisLimit: 'Downstream services need constant load. Can\'t handle bursts.',
    whatHappensWhenBlocked: 'Job is rejected. User must retry later or job is queued.',
    companiesUsing: ['AWS SQS', 'RabbitMQ', 'Celery', 'Sidekiq']
  }
];

/**
 * Get use case by ID
 */
export function getUseCase(id: string): UseCase | undefined {
  return useCases.find(uc => uc.id === id);
}

/**
 * Get use cases by algorithm
 */
export function getUseCasesByAlgorithm(algorithm: RateLimitAlgorithm): UseCase[] {
  return useCases.filter(uc => uc.config.algorithm === algorithm);
}

