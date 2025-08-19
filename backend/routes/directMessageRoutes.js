import express from 'express';
import { sendDirectMessage, getDirectMessages, markMessagesAsRead, getUnreadDMCounts } from '../controllers/directMessageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, sendDirectMessage);

router.route('/unread-counts')
        .get(protect, getUnreadDMCounts);
        
router.route('/:recipientId')
    .get(protect, getDirectMessages);


router.route('/read/:recipientId')
    .put(protect, markMessagesAsRead);

// router.route('/unread-counts')
//     .get(protect, getUnreadDMCounts);

export default router;