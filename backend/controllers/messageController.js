import asyncHandler from "express-async-handler"
import Message from "../models/Message.js"

const sendMessage = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const {content} = req.body
    const {_id: sender} = req.user

    if(!content){
        res.status(400)
        throw new Error("Message content cannot be empty")
    }

    const newMessage = await Message.create({
        group: groupId,
        sender,
        content
    })

    await newMessage.populate("sender", "name")

    req.io.to(groupId).emit("message:new", newMessage)

    res.status(201).json(newMessage)
})

const getGroupMessages = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const messages = await Message.find({group: groupId}).populate("sender", "name").sort({createdAt: 1})
    res.status(200).json(messages)
})

export {sendMessage, getGroupMessages}