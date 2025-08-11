// backend/routes/calendarRoutes.js
import express from "express"
import { createCalendarEvent, getGroupCalendarEvents, updateCalendarEvent, deleteCalendarEvent } from "../controllers/calendarController.js" // UPDATED IMPORT
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router({mergeParams: true})

router.route("/").post(protect, createCalendarEvent).get(protect, getGroupCalendarEvents)
router.route("/:eventId").put(protect, updateCalendarEvent).delete(protect, deleteCalendarEvent); // NEW ROUTE

export default router