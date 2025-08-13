import express, { Router } from "express"
import {getMyNotifications, markNotificationAsRead} from "../controllers/notificationController.js"
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router()

router.route("/").get(protect, getMyNotifications)
router.route("/:notificationId").put(protect, markNotificationAsRead)

export default router