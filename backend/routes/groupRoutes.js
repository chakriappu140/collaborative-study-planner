import express from "express"
import { 
    createGroup, 
    getMyGroups, 
    deleteGroup, 
    getGroupDetails, 
    addMemberToGroup,
    generateInviteToken,
    joinGroupWithToken,
    removeMemberFromGroup // NEW IMPORT
} from "../controllers/groupController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();

router.route('/').post(protect, createGroup);
router.route('/my-groups').get(protect, getMyGroups);
router.route('/:groupId')
    .get(protect, getGroupDetails)
    .delete(protect, deleteGroup);
router.route('/:groupId/members').post(protect, addMemberToGroup);
router.route('/:groupId/members/:memberId').delete(protect, removeMemberFromGroup); // NEW DELETE ROUTE

router.post('/:groupId/invite', protect, generateInviteToken);
router.post('/join/:token', protect, joinGroupWithToken);

export default router;
