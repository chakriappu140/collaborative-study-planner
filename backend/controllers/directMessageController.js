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

    await DirectMessage.updateMany(
        { sender: recipientId, recipient: userId, isRead: false },
        { $set: { isRead: true } }
    );

    req.io.to(recipientId.toString()).emit('dm:read', userId);

    res.status(200).json({ message: "Messages marked as read" });
});

const getUnreadDMCounts = asyncHandler(async (req, res) => {
    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error("User not authenticated or user ID is missing.");
    }
    
    const { _id: userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error("Invalid user ID provided.");
    }

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
