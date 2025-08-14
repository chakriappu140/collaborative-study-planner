import asyncHandler from "express-async-handler"
import CalendarEvent from "../models/CalendarEvent.js"
import Group from "../models/Group.js"
import Notification from "../models/Notification.js"; // NEW IMPORT

// The same createNotification helper from taskController and messageController.
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

const createCalendarEvent = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const {title, description, start, end} = req.body
    const senderId = req.user._id;

    if(!title || !start || !end){
        res.status(400)
        throw new Error("Event title, start, and end dates are required")
    }

    const newEvent = await CalendarEvent.create({
        group: groupId,
        title,
        description,
        start,
        end
    })

    req.io.to(groupId).emit("event:created", newEvent)

    // NEW: Create notification for new event
    const group = await Group.findById(groupId);
    if(group) {
        await createNotification(req, groupId, senderId, `${req.user.name} created a new event: "${title}" in ${group.name}`, `/groups/${groupId}`);
    }

    res.status(201).json({
        message: "Event created successfully",
        event: newEvent
    })
})

const getGroupCalendarEvents = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const events = await CalendarEvent.find({group: groupId})
    res.status(200).json(events)
})

const updateCalendarEvent = asyncHandler(async (req, res) => {
    const { eventId, groupId } = req.params;
    const { title, description, start, end } = req.body;
    const senderId = req.user._id;

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
        res.status(404);
        throw new Error("Event not found");
    }

    const group = await Group.findById(event.group);
    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());
    
    if (!isMember) {
        res.status(403);
        throw new Error("User not authorized to update this event");
    }
    
    event.title = title || event.title;
    event.description = description || event.description;
    event.start = start || event.start;
    event.end = end || event.end;

    const updatedEvent = await event.save();

    req.io.to(event.group.toString()).emit("event:updated", updatedEvent);

    // NEW: Create notification for updated event
    if(group) {
        await createNotification(req, groupId, senderId, `${req.user.name} updated the event "${title}" in ${group.name}`, `/groups/${groupId}`);
    }

    res.status(200).json(updatedEvent);
});

const deleteCalendarEvent = asyncHandler(async (req, res) => {
    const { eventId, groupId } = req.params;
    const senderId = req.user._id;

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
        res.status(404);
        throw new Error("Event not found");
    }

    const group = await Group.findById(event.group);
    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember) {
        res.status(403);
        throw new Error("User not authorized to delete this event");
    }

    const title = event.title; // Get title before deletion
    await CalendarEvent.deleteOne({ _id: eventId });

    req.io.to(event.group.toString()).emit("event:deleted", eventId);

    // NEW: Create notification for deleted event
    if(group) {
        await createNotification(req, groupId, senderId, `${req.user.name} deleted the event "${title}" from ${group.name}`, `/groups/${groupId}`);
    }

    res.status(200).json({ message: "Event removed" });
});

export {
    createCalendarEvent,
    getGroupCalendarEvents,
    updateCalendarEvent,
    deleteCalendarEvent
};