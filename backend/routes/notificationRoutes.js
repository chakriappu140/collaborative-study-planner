import express from "express"
import { getMyNotifications, markNotificationAsRead, deleteAllNotifications } from "../controllers/notificationController.js" // UPDATED IMPORT
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router()

router.route("/").get(protect, getMyNotifications).delete(protect, deleteAllNotifications); // NEW DELETE ROUTE
router.route("/:notificationId").put(protect, markNotificationAsRead)

export default router