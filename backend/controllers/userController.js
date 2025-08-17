import asyncHandler from "express-async-handler"
import User from "../models/User.js"
import generateToken from "../utils/generateToken.js"
import DirectMessage from "../models/DirectMessage.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Setup multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

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

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user){
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        
        // Handle avatar upload if a file is provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                {
                    folder: `study-planner/avatars`,
                    resource_type: 'auto'
                }
            );
            user.avatar = result.secure_url;
        }

        if(req.body.password){
            user.password = req.body.password
        }
        
        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            token: generateToken(updatedUser._id, updatedUser.name, updatedUser.email)
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
});

export {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    upload
}
