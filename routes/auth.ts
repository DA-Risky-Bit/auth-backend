import { Router } from 'express';
import * as authController from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authController.logout);

export default router;
