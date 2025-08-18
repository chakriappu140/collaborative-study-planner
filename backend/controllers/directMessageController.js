import asyncHandler from "express-async-handler";
import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const createNotification = async (io, recipientId, senderId, message, link) => {
  try {
    const notif = await Notification.create({
      user: recipientId,
      message,
      link,
    });

    io.to(recipientId.toString()).emit("notification:new", notif);
  } catch (error) {
    console.error("Failed to create notification", error);
  }
};

const sendDirectMessage = asyncHandler(async (req, res) => {
  const { recipientId, content, replyTo } = req.body;
  const senderId = req.user._id;

  if (!recipientId || !content) {
    res.status(400);
    throw new Error("Recipient ID and content required");
  }

  const newMsg = await DirectMessage.create({
    sender: senderId,
    recipient: recipientId,
    content,
    replyTo: replyTo || null,
  });

  await newMsg.populate('sender', 'name avatar email');
  await newMsg.populate({
    path: 'replyTo',
    populate: { path: 'sender', select: 'name avatar email' }
  });

  req.io.to(recipientId.toString()).emit("dm:new", newMsg);

  const sender = await User.findById(senderId);
  if (sender) {
    const notifMsg = `${sender.name} sent you a new message`;
    const notifLink = `/direct/${senderId}`; // Adjust as needed

    await createNotification(req.io, recipientId, senderId, notifMsg, notifLink);
  }

  res.status(201).json(newMsg);
});

const getDirectMessages = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user._id;

  const messages = await DirectMessage.find({
    $or: [
      { sender: userId, recipient: recipientId },
      { sender: recipientId, recipient: userId }
    ]
  }).populate('sender', 'name avatar email')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar email' } })
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

const markMessagesRead = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user._id;

  await DirectMessage.updateMany({ sender: recipientId, recipient: userId, isRead: false }, { $set: { isRead: true } });

  req.io.to(recipientId.toString()).emit("dm:read", userId);

  res.status(200).json({ message: "Messages marked read" });
});

const getUnreadCounts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId || !userId.toString()) {
    res.status(401);
    throw new Error("User ID missing");
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const unreadCounts = await DirectMessage.aggregate([
    { $match: { recipient: new mongoose.Types.ObjectId(userId), isRead: false } },
    { $group: { _id: "$sender", count: { $sum: 1 } } }
  ]);

  res.status(200).json(unreadCounts);
});

export {
  createNotification,
  sendDirectMessage,
  getDirectMessages,
  markMessagesRead,
  getUnreadCounts
};
