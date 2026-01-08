import { urlRepository } from '../repositories/urlRepository.js';
import { cacheService } from './cacheService.js';
import { generateRandomCode } from './base62.js';
import { config } from '../config/index.js';

export interface ShortenUrlResult {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isExisting: boolean;
}

export interface ResolveUrlResult {
  originalUrl: string;
  fromCache: boolean;
}

export class UrlServiceError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_URL' | 'NOT_FOUND' | 'EXPIRED' | 'GENERATION_FAILED'
  ) {
    super(message);
    this.name = 'UrlServiceError';
  }
}

const MAX_GENERATION_ATTEMPTS = 10;

export const urlService = {
  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Shorten a long URL
   * - Returns existing short URL if the same URL was already shortened
   * - Generates a new short code otherwise
   */
  async shortenUrl(originalUrl: string, expiresAt?: Date): Promise<ShortenUrlResult> {
    // Validate URL
    if (!this.isValidUrl(originalUrl)) {
      throw new UrlServiceError('Invalid URL format', 'INVALID_URL');
    }

    // Check for existing URL (deduplication)
    const existing = await urlRepository.findByOriginalUrl(originalUrl);
    if (existing) {
      return {
        shortCode: existing.short_code,
        shortUrl: `${config.url.baseUrl}/${existing.short_code}`,
        originalUrl: existing.original_url,
        isExisting: true,
      };
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;

    do {
      shortCode = generateRandomCode(config.url.shortCodeLength);
      const exists = await urlRepository.shortCodeExists(shortCode);
      if (!exists) break;
      attempts++;
    } while (attempts < MAX_GENERATION_ATTEMPTS);

    if (attempts >= MAX_GENERATION_ATTEMPTS) {
      throw new UrlServiceError(
        'Failed to generate unique short code',
        'GENERATION_FAILED'
      );
    }

    // Store in database
    const record = await urlRepository.create({
      shortCode,
      originalUrl,
      expiresAt,
    });

    // Cache the mapping
    await cacheService.setUrl(shortCode, originalUrl, expiresAt || null);

    return {
      shortCode: record.short_code,
      shortUrl: `${config.url.baseUrl}/${record.short_code}`,
      originalUrl: record.original_url,
      isExisting: false,
    };
  },

  /**
   * Resolve a short code to original URL
   * Uses cache-aside pattern: check cache first, fallback to database
   */
  async resolveUrl(shortCode: string): Promise<ResolveUrlResult> {
    // Check cache first
    const cached = await cacheService.getUrl(shortCode);
    if (cached) {
      // Increment click count asynchronously (fire-and-forget)
      urlRepository.incrementClickCount(shortCode).catch(console.error);
      
      return {
        originalUrl: cached.originalUrl,
        fromCache: true,
      };
    }

    // Fallback to database
    const record = await urlRepository.findByShortCode(shortCode);
    
    if (!record) {
      throw new UrlServiceError('Short URL not found', 'NOT_FOUND');
    }

    // Check if expired
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      throw new UrlServiceError('Short URL has expired', 'EXPIRED');
    }

    // Update cache for future requests
    await cacheService.setUrl(shortCode, record.original_url, record.expires_at);
    
    // Increment click count
    await urlRepository.incrementClickCount(shortCode);

    return {
      originalUrl: record.original_url,
      fromCache: false,
    };
  },

  /**
   * Get URL statistics
   */
  async getStats(shortCode: string) {
    const record = await urlRepository.getStats(shortCode);
    
    if (!record) {
      throw new UrlServiceError('Short URL not found', 'NOT_FOUND');
    }

    return {
      shortCode: record.short_code,
      shortUrl: `${config.url.baseUrl}/${record.short_code}`,
      originalUrl: record.original_url,
      createdAt: record.created_at,
      expiresAt: record.expires_at,
      clickCount: record.click_count,
    };
  },
};

