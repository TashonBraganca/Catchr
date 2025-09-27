import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as roomController from '../controllers/roomController.js';

const router = Router();

router.get('/', asyncHandler(roomController.getRooms));
router.post('/', asyncHandler(roomController.createRoom));
router.get('/:roomId', asyncHandler(roomController.getRoomById));
router.get('/:roomId/messages', asyncHandler(roomController.getRoomMessages));

export default router;