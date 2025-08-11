import express from "express"
import {sendMessage, getGroupMessages} from "../controllers/messageController.js"
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router({mergeParams: true})

router.route("/").post(protect, sendMessage).get(protect, getGroupMessages)

export default router