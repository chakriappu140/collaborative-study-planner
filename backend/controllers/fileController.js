import asyncHandler from "express-async-handler";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";
import { v2 as cloudinary } from 'cloudinary'; // NEW IMPORT

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// A helper function to create a notification
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

// Use memory storage for multer since we're uploading to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @desc    Upload a file to a group
// @route   POST /api/groups/:groupId/files
// @access  Private
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

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
            folder: `study-planner/${groupId}`,
            resource_type: 'auto'
        }
    );

    const newFile = await File.create({
        group: groupId,
        uploader: uploaderId,
        fileName: req.file.originalname, // Store original name
        filePath: result.secure_url,     // Store the secure URL from Cloudinary
        publicId: result.public_id       // Store the public_id for deletion
    });

    req.io.to(groupId).emit("file:uploaded", newFile);
    await createNotification(req, groupId, uploaderId, `${uploaderName} uploaded a new file in ${group.name}`, `/groups/${groupId}`);

    res.status(201).json(newFile);
});

// @desc    Get all files for a group
// @route   GET /api/groups/:groupId/files
// @access  Private
const getGroupFiles = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const files = await File.find({ group: groupId }).populate('uploader', 'name');
    res.status(200).json(files);
});

// @desc    Delete a file
// @route   DELETE /api/groups/:groupId/files/:fileId
// @access  Private (Admin only)
const deleteFile = asyncHandler(async (req, res) => {
    const { groupId, fileId } = req.params;
    const { _id: userId } = req.user;

    const file = await File.findById(fileId);

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    const group = await Group.findById(groupId);
    if (!group || group.admin.toString() !== userId.toString()) {
        res.status(401);
        throw new Error("User not authorized to delete this file");
    }
    
    // Delete the file from Cloudinary using its public_id
    if (file.publicId) {
        await cloudinary.uploader.destroy(file.publicId);
    }
    
    await File.deleteOne({ _id: fileId });

    req.io.to(groupId).emit("file:deleted", fileId);
    await createNotification(req, groupId, userId, `${req.user.name} deleted the file "${file.fileName}" from ${group.name}`, `/groups/${groupId}`);

    res.status(200).json({ message: "File removed" });
});

export { upload, uploadFile, getGroupFiles, deleteFile };
