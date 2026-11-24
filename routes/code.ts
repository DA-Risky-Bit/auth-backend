import { Router } from 'express';
import * as codeController from '../controllers/code.js';

const router = Router();

router.get('/', codeController.getLobbyCode);
router.put('/', codeController.regenerateLobbyCode);

export default router;
