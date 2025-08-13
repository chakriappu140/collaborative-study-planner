import asyncHandler from "express-async-handler"
import Message from "../models/Message.js"
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";

const createNotification = async (req, groupId, senderId, message, link) => {
    try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const membersToNotify = group.members.filter(member => member.toString() !== senderId.toString());

        const notifications = membersToNotify.map(memberId => ({
            user: memberId,
            message,
            link
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        for (const notif of createdNotifications) {
            req.io.to(notif.user.toString()).emit('notification:new', notif);
        }
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};


const sendMessage = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { content } = req.body;
    const { _id: sender } = req.user;

    if (!content) {
        res.status(400);
        throw new Error("Message content cannot be empty");
    }

    const newMessage = await Message.create({
        group: groupId,
        sender,
        content
    });

    await newMessage.populate('sender', 'name');

    req.io.to(groupId).emit("message:new", newMessage);
    
    // FIX: Get the group name before creating the notification
    const group = await Group.findById(groupId);
    if (group) {
        await createNotification(req, groupId, sender, `${req.user.name} sent a new message in ${group.name}`, `/groups/${groupId}`);
    }


    res.status(201).json(newMessage);
});

const getGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const messages = await Message.find({ group: groupId })
        .populate('sender', 'name')
        .sort({ createdAt: 1 });
    res.status(200).json(messages);
});

export { sendMessage, getGroupMessages };