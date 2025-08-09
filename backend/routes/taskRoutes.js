import express from "express"
import {createTask, getGroupTasks, updateTask, deleteTask} from "../controllers/taskController.js"
import {protect} from "../middleware/authMiddleware.js"

const router = express.Router({mergeParams: true})

router.route("/").post(protect, createTask).get(protect, getGroupTasks)
router.route("/:taskId").put(protect, updateTask).delete(protect, deleteTask)

export default router