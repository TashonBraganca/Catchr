import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as authController from '../controllers/authController.js';
const router = Router();
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.get('/me', asyncHandler(authController.getCurrentUser));
export default router;
//# sourceMappingURL=auth.js.map