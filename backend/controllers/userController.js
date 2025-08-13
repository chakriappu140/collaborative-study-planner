import asyncHandler from "express-async-handler"
import User from "../models/User.js"
import generateToken from "../utils/generateToken.js"

const authUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});

    if(user && (await user.matchPassword(password))){
        // Pass name and email to generateToken
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
        // Pass name and email to generateToken
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

export {authUser, registerUser}
