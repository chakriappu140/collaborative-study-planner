import asyncHandler from "express-async-handler"
import Group from "../models/Group.js"

const createGroup = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name){
        res.status(400)
        throw new Error("Group name is required")
    }

    const group = await Group.create({
        name,
        description,
        admin: req.user._id,
        members: [req.user._id]
    })

    res.status(201).json({
        message: "Group created successfully",
        group
    })
})

const getMyGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({members: req.user._id})
    res.status(200).json(groups)
})

export {createGroup, getMyGroups}