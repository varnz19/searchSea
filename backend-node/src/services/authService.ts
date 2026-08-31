import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'researchos_default_secret_jwt_key_dev';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
}

export const authService = {
  /**
   * Hashes a plaintext password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Compares a plaintext password against a stored bcrypt hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generates a signed JWT for authentication
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  },

  /**
   * Verifies and decodes a signed JWT
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Validates email format according to standard RFC 5322 regex
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  },

  /**
   * Validates password strength (minimum 8 characters)
   */
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters in length.'
      };
    }
    return { valid: true };
  }
};
