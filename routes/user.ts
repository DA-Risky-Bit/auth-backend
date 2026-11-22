import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Only admins can view the full list of users
router.get('/', authenticateToken, requireAdmin, getUsers);

// Any authenticated user can view a specific user by ID
router.get('/:id', authenticateToken, getUserById);

// If creating a user manually via admin, protect it (otherwise registration is handled in auth routes)
router.post('/', authenticateToken, requireAdmin, createUser);

// Authenticated users can update their details
router.put('/:id', authenticateToken, updateUser);

// Authenticated users can delete themselves (or admins can delete anyone)
router.delete('/:id', authenticateToken, deleteUser);

export default router;
