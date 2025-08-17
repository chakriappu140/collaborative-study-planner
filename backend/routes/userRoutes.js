import express from "express"
import { authUser, registerUser, getUserProfile, updateUserProfile, getAllUsers, upload } from "../controllers/userController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post('/login', authUser)
router.route("/")
    .post(registerUser)
    .get(protect, getAllUsers)

// New routes for getting and updating the user profile
router.route("/profile")
    .get(protect, getUserProfile)
    .put(protect, upload.single('avatar'), updateUserProfile) // UPDATED ROUTE

export default router;
