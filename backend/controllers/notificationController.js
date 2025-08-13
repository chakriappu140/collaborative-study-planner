import asyncHandler from "express-async-handler"
import Notification from "../models/Notification.js"

const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({user: req.user._id}).sort({createdAt: -1})
    res.status(200).json(notifications)
})

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const {notificationId} = req.params
    const notification = await Notification.findById(notificationId)

    if(!notification){
        res.status(404)
        throw new Error("Notification not found")
    }

    if(notification.user.toString() !== req.user._id.toString()){
        res.status(401)
        throw new Error("Not authorized to access this notification")
    }

    notification.isRead = true
    const updatedNotification = await notification.save()

    res.status(200).json(updatedNotification)
})

// @desc    Delete all notifications for a user
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    await Notification.deleteMany({ user: userId });
    res.status(200).json({ message: "All notifications deleted" });
});

export {getMyNotifications, markNotificationAsRead, deleteAllNotifications}