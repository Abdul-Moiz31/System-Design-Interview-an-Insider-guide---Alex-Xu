import { Router, Request, Response, NextFunction } from 'express';
import { urlService } from '../services/urlService.js';

const router = Router();

/**
 * GET /:shortCode
 * Redirect to the original URL
 */
router.get(
  '/:shortCode',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      
      // Validate short code format
      if (!/^[a-zA-Z0-9]+$/.test(shortCode)) {
        res.status(400).json({
          error: 'INVALID_CODE',
          message: 'Invalid short code format',
        });
        return;
      }

      const result = await urlService.resolveUrl(shortCode);

      // Use 301 for permanent redirect (can be cached by browsers)
      // Use 302 for temporary redirect (if you want to track every click)
      res.redirect(302, result.originalUrl);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

