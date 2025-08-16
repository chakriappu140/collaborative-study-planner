import asyncHandler from "express-async-handler";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";

// Helper function to create a notification
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

// Setup multer for file storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        // You can add file type validation here if needed
        cb(null, true);
    },
});

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

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(uploaderId)) {
        res.status(403);
        throw new Error("Not authorized to upload files to this group");
    }

    const newFile = await File.create({
        group: groupId,
        uploader: uploaderId,
        fileName: req.file.filename,
        filePath: req.file.path,
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
    
    // Remove the file from the server's file system
    if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
    }
    
    await File.deleteOne({ _id: fileId });

    req.io.to(groupId).emit("file:deleted", fileId);
    await createNotification(req, groupId, userId, `${req.user.name} deleted the file "${file.fileName}" from ${group.name}`, `/groups/${groupId}`);

    res.status(200).json({ message: "File removed" });
});

export { upload, uploadFile, getGroupFiles, deleteFile };