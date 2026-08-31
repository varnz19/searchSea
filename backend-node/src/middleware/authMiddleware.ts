import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authService, TokenPayload } from '../services/authService';

const prisma = new PrismaClient();

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string | null;
      };
    }
  }
}

/**
 * Middleware that requires a valid JWT in httpOnly cookie or Authorization header.
 * Attaches the authenticated user to `req.user`.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check httpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in to access this resource.'
    });
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Session has expired or is invalid. Please log in again.'
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User account associated with this session no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Internal error validating session.' });
  }
};
