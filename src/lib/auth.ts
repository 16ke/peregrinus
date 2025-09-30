// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    throw new AuthError('Invalid token');
  }
};