// backend/routes/groupRoutes.js
import express from "express";
import { 
    createGroup, 
    getMyGroups, 
    deleteGroup, 
    getGroupDetails, 
    addMemberToGroup,
    generateInviteToken, // <-- NEW IMPORT
    joinGroupWithToken // <-- NEW IMPORT
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route('/').post(protect, createGroup);
router.route('/my-groups').get(protect, getMyGroups);
router.route('/:groupId')
    .get(protect, getGroupDetails)
    .delete(protect, deleteGroup);
router.route('/:groupId/members').post(protect, addMemberToGroup);

router.post('/:groupId/invite', protect, generateInviteToken); // <-- NEW ROUTE
router.post('/join/:token', protect, joinGroupWithToken); // <-- NEW ROUTE

export default router;