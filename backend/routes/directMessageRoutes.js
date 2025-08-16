import express from 'express';
import { sendDirectMessage, getDirectMessages } from '../controllers/directMessageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, sendDirectMessage);

router.route('/:recipientId')
    .get(protect, getDirectMessages);

export default router;
