import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/vars.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: number;
  };
}


/**
 * Middleware to verify JWT tokens and protect routes.
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.session;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Session is invalid or expired' });
    }
    const { id, email, role } = payload as AuthenticatedRequest['user'] & jwt.JwtPayload;
    req.user = { id, email, role };
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
