import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../service/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_secret_key';

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

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({ user: newUser, token });
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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ user, token });
  } catch (error) {
    // Pass unexpected/server errors to global middleware
    return next(error);
  }
};
