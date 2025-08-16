import express from "express"
import { getMyNotifications, markNotificationAsRead, deleteAllNotifications, deleteNotification } from "../controllers/notificationController.js" // UPDATED IMPORT
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router()

router.route("/").get(protect, getMyNotifications).delete(protect, deleteAllNotifications);
router.route("/:notificationId")
    .put(protect, markNotificationAsRead)
    .delete(protect, deleteNotification); // NEW DELETE ROUTE

export default router
