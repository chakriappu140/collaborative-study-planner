import express from "express"
import {createGroup, getMyGroups} from "../controllers/groupController.js"
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router()

router.route('/').post(protect, createGroup)
router.route('/my-groups').get(protect, getMyGroups)

export default router;