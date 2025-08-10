import express from "express"
import {createCalendarEvent, getGroupCalendarEvents} from "../controllers/calendarController.js"
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router({mergeParams: true})

router.route("/").post(protect, createCalendarEvent).get(protect, getGroupCalendarEvents)

export default router