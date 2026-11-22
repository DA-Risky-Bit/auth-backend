import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../service/user.js';
import { JWT_SECRET, SESSION_MS } from '../config/vars.js';


const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  partitioned: true,
  domain: process.env.COOKIE_DOMAIN,
};

const issueSession = (res: Response, user: { id: number; email: string; role: number }) => {
  console.log('issueSession user:', user);
  if (user?.id == null) throw new Error('issueSession: user has no id');
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.cookie('session', token, { ...cookieOpts, maxAge: SESSION_MS });
};

/**
 * Registers a new user and returns a JWT token.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Specific business rule check example: password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const newUser = await userService.createUser(email, username, password);

    issueSession(res, newUser);
    return res.status(201).json({ user: newUser });
  } catch (error: any) {
    // Specific error handling for database unique conflicts (e.g., duplicate email)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email or username already exists' });
    }

    // Pass any other unhandled errors to the global error middleware
    return next(error);
  }
};


/**
 * Authenticates user credentials and returns a JWT token.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const isValid = await userService.verifyPassword(email, password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await userService.getByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    issueSession(res, user);
    return res.status(200).json({ user });
  } catch (error) {
    // Pass unexpected/server errors to global middleware
    return next(error);
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('session', cookieOpts);
  res.set('Cache-Control', 'no-store');
  return res.status(204).end();
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = (req as any).user as { id?: number } | undefined;
    if (sessionUser?.id == null) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Load fresh data from the DB; the JWT only holds id/email/role
    const user = await userService.getDetailedById(sessionUser.id); // returns User
    if (!user || user.deleted) {
      res.clearCookie('session', cookieOpts);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id, username, email, role } = user;

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ user: { id, username, email, role } });
  } catch (error) {
    return next(error);
  }
};
