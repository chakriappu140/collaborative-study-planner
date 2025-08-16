import express from "express"
import { createTask, getGroupTasks, updateTask, deleteTask, getTaskProgress } from "../controllers/taskController.js" // NEW IMPORT
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router({ mergeParams: true })

router.route("/").post(protect, createTask).get(protect, getGroupTasks)
router.route("/progress").get(protect, getTaskProgress); // NEW ROUTE
router.route("/:taskId").put(protect, updateTask).delete(protect, deleteTask)

export default router
