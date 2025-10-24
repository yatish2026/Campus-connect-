import express from 'express';
import * as messageController from '../controllers/message.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, messageController.createMessage);
router.get('/conversation/:userId', protectRoute, messageController.getConversation);
router.get('/conversations', protectRoute, messageController.getConversations);
router.post('/mark-read', protectRoute, messageController.markAsRead);

export default router;