import express from "express"
import { authUser, registerUser, getUserProfile, updateUserProfile, getAllUsers } from "../controllers/userController.js" // NEW IMPORT
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post('/login', authUser)
router.route("/")
    .post(protect, registerUser)
    .get(protect, getAllUsers) // NEW ROUTE

router.route("/profile")
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)

export default router;
