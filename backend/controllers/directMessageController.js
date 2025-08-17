import asyncHandler from "express-async-handler";
import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const sendDirectMessage = asyncHandler(async (req, res) => {
    const { recipientId, content } = req.body;
    const { _id: senderId } = req.user;

    if (!recipientId || !content) {
        res.status(400);
        throw new Error("Recipient ID and message content are required");
    }

    const newMessage = await DirectMessage.create({
        sender: senderId,
        recipient: recipientId,
        content
    });

    await newMessage.populate('sender', 'name');

    // Emit 'dm:new' event to the recipient's private room
    req.io.to(recipientId.toString()).emit("dm:new", newMessage);
    
    res.status(201).json(newMessage);
});

const getDirectMessages = asyncHandler(async (req, res) => {
    const { recipientId } = req.params;
    const { _id: userId } = req.user;

    const messages = await DirectMessage.find({
        $or: [
            { sender: userId, recipient: recipientId },
            { sender: recipientId, recipient: userId }
        ]
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { recipientId } = req.params;
    const { _id: userId } = req.user;

    const messagesToUpdate = await DirectMessage.find({ 
        sender: recipientId, 
        recipient: userId, 
        isRead: false 
    });

    if (messagesToUpdate.length > 0) {
        await DirectMessage.updateMany(
            { _id: { $in: messagesToUpdate.map(msg => msg._id) } },
            { $set: { isRead: true } }
        );

        // Emit 'dm:read' event to the sender's private room
        req.io.to(recipientId.toString()).emit('dm:read'); // Don't need to pass userId, just the event name
    }

    res.status(200).json({ message: "Messages marked as read" });
});

const getUnreadDMCounts = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user;

    const unreadCounts = await DirectMessage.aggregate([
        {
            $match: {
                recipient: new mongoose.Types.ObjectId(userId),
                isRead: false
            }
        },
        {
            $group: {
                _id: "$sender",
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json(unreadCounts);
});

export { sendDirectMessage, getDirectMessages, markMessagesAsRead, getUnreadDMCounts };