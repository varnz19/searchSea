import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/authService';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Rate limiting on auth endpoints (prevents brute-force credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register
 * Registers a new researcher account
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!authService.validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid institutional or personal email address.' });
    }

    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account is already registered with this email address.' });
    }

    // Hash password and persist user
    const passwordHash = await authService.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ? name.trim() : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generate JWT and set httpOnly cookie
    const token = authService.generateToken({ userId: user.id, email: user.email });
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: 'Account registered successfully.',
      user,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during account registration.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues session token
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({ error: "That email and password don't match." });
    }

    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "That email and password don't match." });
    }

    // Generate JWT and set httpOnly cookie
    const token = authService.generateToken({ userId: user.id, email: user.email });
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during authentication.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({ message: 'Session closed successfully.' });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
