import asyncHandler from "express-async-handler";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import File from "../models/File.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer in-memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to create notifications
const createNotification = async (io, groupId, senderId, message, link) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    const recipients = group.members.filter(memberId => memberId.toString() !== senderId.toString());

    const notifications = recipients.map(userId => ({
      user: userId,
      message,
      link,
    }));

    const createdNotifs = await Notification.insertMany(notifications);

    // Emit notification to each recipient
    for (const notif of createdNotifs) {
      io.to(notif.user.toString()).emit("notification:new", notif);
    }
  } catch (error) {
    console.error("Failed to create notifications", error);
  }
};

// @desc Upload a file to a group
// @route POST /api/groups/:groupId/files
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: uploaderId, name: uploaderName } = req.user;

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const group = await Group.findById(groupId);
  if (!group || !group.members.includes(uploaderId)) {
    res.status(403);
    throw new Error("Not authorized to upload files to this group");
  }

  // Upload image/file data to Cloudinary
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `study-planner/${groupId}`,
    resource_type: "auto",
  });

  // Save file record in DB
  const fileDoc = await File.create({
    group: groupId,
    uploader: uploaderId,
    fileName: req.file.originalname,
    filePath: result.secure_url,
    publicId: result.public_id,
  });

  // Emit new file event to group room
  req.io.to(groupId).emit("file:uploaded", fileDoc);

  // Notify group members of the upload
  await createNotification(
    req.io,
    groupId,
    uploaderId,
    `${uploaderName} uploaded a new file in ${group.name}`,
    `/groups/${groupId}`
  );

  res.status(201).json(fileDoc);
});

// @desc Get all files for a group
// @route GET /api/groups/:groupId/files
// @access Private
const getFiles = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const files = await File.find({ group: groupId }).populate("uploader", "name avatar");
  res.status(200).json(files);
});

// @desc Delete a file from a group
// @route DELETE /api/groups/:groupId/files/:fileId
// @access Private (Admin only)
const deleteFile = asyncHandler(async (req, res) => {
  const { groupId, fileId } = req.params;
  const userId = req.user._id;

  const file = await File.findById(fileId);
  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  const group = await Group.findById(groupId);
  if (!group || group.admin.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this file");
  }

  // Delete from Cloudinary if publicId exists
  if (file.publicId) {
    await cloudinary.uploader.destroy(file.publicId);
  }

  // Remove from DB
  await File.deleteOne({ _id: fileId });

  // Emit delete event
  req.io.to(groupId).emit("file:deleted", fileId);

  // Notify group members of file deletion
  await createNotification(
    req.io,
    groupId,
    userId,
    `${req.user.name} deleted the file "${file.fileName}" from ${group.name}`,
    `/groups/${groupId}`
  );

  res.status(200).json({ message: "File deleted" });
});

export { upload, uploadFile, getFiles, deleteFile };
