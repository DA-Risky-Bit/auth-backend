import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: number;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_secret_key';

/**
 * Middleware to verify JWT tokens and protect routes.
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is invalid or expired' });
    }
    req.user = user as AuthenticatedRequest['user'];
    next();
  });
};

/**
 * Middleware to restrict routes to admin users (role === 1).
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 1) {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};
