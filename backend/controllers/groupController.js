import asyncHandler from "express-async-handler"
import Group from "../models/Group.js"
import User from "../models/User.js"
import CalendarEvent from "../models/CalendarEvent.js"
import Task from "../models/Task.js"
import crypto from "crypto"

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

const getGroupDetails = asyncHandler(async (req, res) => {
    const {groupId} = req.params

    const group = await Group.findById(groupId)

    if(!group){
        res.status(404)
        throw new Error("Group not found")
    }

    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString())

    if(!isMember){
        res.status(403)
        throw new Error("User is not a member of this group")
    }

    const populatedGroup = await Group.findById(groupId).populate("members", "name email")

    res.status(200).json(populatedGroup)
})

const deleteGroup = asyncHandler(async (req, res) => {
    const {groupId} = req.params

    const group = await Group.findById(groupId)

    if(!group){
        res.status(404)
        throw new Error("Group not found")
    }

    if(group.admin.toString() !== req.user._id.toString()){
        res.status(401)
        throw new Error("User not authorized to delete this group")
    }

    await Task.deleteMany({group: groupId})
    await CalendarEvent.deleteMany({group: groupId})

    await Group.deleteOne({_id: groupId})

    req.io.to(groupId).emit("group:deleted", groupId)

    res.status(200).json({message: "Group and all associated data removed"})
})

const addMemberToGroup = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const {email} = req.body

    if(!email){
        res.status(400)
        throw new Error("User email is required")
    }

    const group = await Group.findById(groupId)

    if(!group){
        res.status(404)
        throw new Error("Group not found")
    }

    if(group.admin.toString() !== req.user._id.toString()){
        res.status(401)
        throw new Error("User not authorized to add members to this group")
    }

    const userToAdd = await User.findOne({email})

    if(!userToAdd){
        res.status(404)
        throw new Error("User with that email not found")
    }

    if(group.members.includes(userToAdd._id)){
        res.status(400)
        throw new Error("User is already a member of this group")
    }

    group.members.push(userToAdd._id)
    await group.save()

    req.io.to(groupId).emit("group:member_added", {
        group,
        member: {_id: userToAdd._id, name: userToAdd.name}
    })

    res.status(200).json({
        message: `${userToAdd.name} added to the group successfully`,
        group
    })
})

const generateInviteToken = asyncHandler(async (req, res) => {
    const {groupId} = req.params

    const group = await Group.findById(groupId)

    if(!group){
        res.status(404)
        throw new Error("Group not found")
    }

    if(group.admin.toString() !== req.user._id.toString()){
        res.status(401)
        throw new Error("User not authorized to generate an invite link")
    }

    const inviteToken = crypto.randomBytes(20).toString('hex')
    const inviteTokenExpires = Date.now() + 3600000

    group.inviteToken = inviteToken
    group.inviteTokenExpires = inviteTokenExpires

    await group.save()

    res.status(200).json({inviteToken})
})

const joinGroupWithToken = asyncHandler(async (req, res) => {
    const {token} = req.params
    const {_id: userId} = req.user

    const group = await Group.findOne({
        inviteToken: token,
        inviteTokenExpires: {$gt: Date.now()}
    })

    if(!group){
        res.status(404)
        throw new Error("Invalid or expired invite token")
    }

    if(group.members.includes(userId)){
        res.status(400)
        throw new Error("You are already a member of this group")
    }

    group.members.push(userId)
    group.inviteToken = undefined
    group.inviteTokenExpires = undefined

    await group.save()

    req.io.to(group._id.toString()).emit("group:member_added", {
        group,
        member: {_id: req.user._id, name: req.user.name}
    })

    res.status(200).json({message: "Successfully joined the group", group})
})

export {createGroup, getMyGroups, deleteGroup, getGroupDetails, addMemberToGroup, generateInviteToken, joinGroupWithToken}