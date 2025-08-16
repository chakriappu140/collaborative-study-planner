import asyncHandler from "express-async-handler"
import User from "../models/User.js"
import generateToken from "../utils/generateToken.js"

const authUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});

    if(user && (await user.matchPassword(password))){
        const token = generateToken(user._id, user.name, user.email)

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
        })
    }else{
        res.status(401)
        throw new Error("Invalid email or password")
    }
})

const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body;

    const userExists = await User.findOne({email})

    if(userExists){
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email, 
        password
    })

    if(user){
        const token = generateToken(user._id, user.name, user.email)

        res.status(201).json({
            _id: user._id,
            name: user.name, 
            email: user.email,
            token
        })
    }else{
        res.status(400)
        throw new Error("Invalid user data")
    }
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password')

    if(user){
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user){
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        
        // Only update password if a new one is provided
        if(req.body.password){
            user.password = req.body.password
        }
        
        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            // Generate a new token if the user was updated
            token: generateToken(updatedUser._id, updatedUser.name, updatedUser.email)
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

export {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile
}
