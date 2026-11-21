import { Request, Response, NextFunction } from 'express';
import * as userService from '../service/user';

// Extend Express Request interface if not already defined globally
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: number;
  };
}

/**
 * Retrieves a paginated list of users.
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const count = parseInt(req.query.count as string) || 10;

    if (offset < 0 || count <= 0) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    const users = await userService.getAll(offset, count);
    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves a single public user by their unique ID.
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await userService.getById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates a new user account.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const newUser = await userService.createUser(email, username, password);
    return res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    return next(error);
  }
};

/**
 * Updates an existing user's username.
 * Allowed if: The user is updating their own profile OR is an admin (role === 1).
 */
export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check ownership or admin status
    const isOwner = currentUser.id === id;
    const isAdmin = currentUser.role === 1;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own account' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'No update fields provided (username required)' });
    }

    const success = await userService.updateUsername(id, username);
    if (!success) {
      return res.status(404).json({ message: 'User not found or update failed' });
    }

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Performs a soft delete on a user.
 * Allowed if: The user is deleting themselves OR is an admin (role === 1).
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check ownership or admin status
    const isOwner = currentUser.id === id;
    const isAdmin = currentUser.role === 1;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own account' });
    }

    const success = await userService.markUserAsDeleted(id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User marked as deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
