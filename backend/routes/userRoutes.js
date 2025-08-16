import express from "express"
import { authUser, registerUser, getUserProfile, updateUserProfile } from "../controllers/userController.js" // NEW IMPORTS
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post('/login', authUser)
router.route("/").post(registerUser)
// New routes for getting and updating the user profile
router.route("/profile")
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)

export default router;
