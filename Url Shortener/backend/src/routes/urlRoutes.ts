import { Router, Request, Response, NextFunction } from 'express';
import { urlService } from '../services/urlService.js';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware.js';

const router = Router();

/**
 * POST /api/shorten
 * Create a short URL from a long URL
 */
router.post(
  '/shorten',
  rateLimitMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url, expiresIn } = req.body;

      if (!url || typeof url !== 'string') {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'URL is required',
        });
        return;
      }

      // Calculate expiration date if provided (in seconds)
      let expiresAt: Date | undefined;
      if (expiresIn && typeof expiresIn === 'number' && expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      const result = await urlService.shortenUrl(url.trim(), expiresAt);

      res.status(result.isExisting ? 200 : 201).json({
        shortCode: result.shortCode,
        shortUrl: result.shortUrl,
        originalUrl: result.originalUrl,
        isExisting: result.isExisting,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/:shortCode
 * Get statistics for a short URL
 */
router.get(
  '/stats/:shortCode',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const stats = await urlService.getStats(shortCode);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

