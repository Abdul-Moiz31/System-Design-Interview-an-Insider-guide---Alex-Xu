import { Router, Request, Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { urlService } from '../services/urlService.js';

const router = Router();

/**
 * GET /api/qr/:shortCode
 * Generate QR code for a short URL
 */
router.get(
  '/qr/:shortCode',
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

      // Get the URL stats to verify it exists
      const stats = await urlService.getStats(shortCode);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(stats.shortUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.json({
        shortCode: stats.shortCode,
        shortUrl: stats.shortUrl,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/qr/:shortCode/image
 * Generate QR code as PNG image
 */
router.get(
  '/qr/:shortCode/image',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      
      if (!/^[a-zA-Z0-9]+$/.test(shortCode)) {
        res.status(400).send('Invalid short code format');
        return;
      }

      const stats = await urlService.getStats(shortCode);
      
      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(stats.shortUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qr-${shortCode}.png"`);
      res.send(qrCodeBuffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

