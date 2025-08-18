import asyncHandler from "express-async-handler";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";

const createNotification = async (io, groupId, senderId, message, link) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    const recipients = group.members.filter(m => m.toString() !== senderId.toString());

    const notifications = recipients.map(userId => ({
      user: userId,
      message,
      link
    }));

    const created = await Notification.insertMany(notifications);

    for (const notif of created) {
      io.to(notif.user.toString()).emit('notification:new', notif);
    }
  } catch (error) {
    console.error("Failed to create notifications", error);
  }
};

const sendMessage = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { content, replyTo } = req.body;
  const senderId = req.user._id;

  if (!content) {
    res.status(400);
    throw new Error("Message content required");
  }

  const newMsg = await Message.create({
    group: groupId,
    sender: senderId,
    content,
    replyTo: replyTo || null,
  });

  await newMsg.populate('sender', 'name avatar email');
  await newMsg.populate({
    path: 'replyTo',
    populate: { path: 'sender', select: 'name avatar email' }
  });

  req.io.to(groupId).emit("message:new", newMsg);

  const group = await Group.findById(groupId);
  if (group) {
    await createNotification(req.io, groupId, senderId,
      `${req.user.name} sent a new message in ${group.name}`, `/groups/${groupId}`
    );
  }

  res.status(201).json(newMsg);
});

const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const messages = await Message.find({ group: groupId })
    .populate('sender', 'name avatar email')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar email' } })
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

export { createNotification, sendMessage, getGroupMessages };

