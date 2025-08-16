import asyncHandler from "express-async-handler";
import DirectMessage from "../models/DirectMessage.js";

// @desc    Send a new direct message
// @route   POST /api/messages/direct
// @access  Private
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

    // Populate sender details for the real-time update
    await newMessage.populate('sender', 'name');

    // Emit a real-time event to the recipient's private room
    // The recipient needs to be listening to their private room (using their user ID)
    req.io.to(recipientId.toString()).emit("dm:new", newMessage);
    
    // Also send a notification to the recipient
    // (This part is for a future notification feature, but we'll include it here)
    // await createNotification(req.io, recipientId.toString(), senderId, `New message from ${req.user.name}`, `/messages/${senderId}`);

    res.status(201).json(newMessage);
});

// @desc    Get conversation history with a user
// @route   GET /api/messages/direct/:recipientId
// @access  Private
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

export { sendDirectMessage, getDirectMessages };
