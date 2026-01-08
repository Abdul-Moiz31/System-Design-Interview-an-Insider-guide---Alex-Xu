import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/userRepository.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post(
  '/signup',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, password } = req.body;

      // Validation
      if (!email || !name || !password) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Email, name, and password are required',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
        });
        return;
      }

      // Check if user already exists
      const exists = await userRepository.emailExists(email);
      if (exists) {
        res.status(409).json({
          error: 'USER_EXISTS',
          message: 'User with this email already exists',
        });
        return;
      }

      // In production, use bcrypt to hash password
      // For demo purposes, we'll store a simple hash
      const passwordHash = Buffer.from(password).toString('base64');

      const user = await userRepository.create({
        email,
        name,
        passwordHash,
      });

      res.status(201).json({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        });
        return;
      }

      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
        return;
      }

      // In production, use bcrypt.compare()
      const passwordHash = Buffer.from(password).toString('base64');
      
      if (user.password_hash !== passwordHash) {
        res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
        return;
      }

      res.json({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

