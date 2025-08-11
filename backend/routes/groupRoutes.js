import express from "express"
import { createGroup, getMyGroups, deleteGroup, getGroupDetails } from "../controllers/groupController.js" 
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();

router.route('/').post(protect, createGroup);
router.route('/my-groups').get(protect, getMyGroups);
router.route("/:groupId").delete(protect, deleteGroup).get(protect, getGroupDetails)

export default router;