// backend/controllers/calendarController.js
import asyncHandler from "express-async-handler"
import CalendarEvent from "../models/CalendarEvent.js"
import Group from "../models/Group.js" // NEW IMPORT

const createCalendarEvent = asyncHandler(async (req, res) => {
    const {groupId} = req.params
    const {title, description, start, end} = req.body

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

// @desc    Update a calendar event
// @route   PUT /api/groups/:groupId/calendar/:eventId
// @access  Private
const updateCalendarEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { title, description, start, end } = req.body;

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
        res.status(404);
        throw new Error("Event not found");
    }

    // You could add an access control check here if you want only the creator or admin to edit
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

    res.status(200).json(updatedEvent);
});

// @desc    Delete a calendar event
// @route   DELETE /api/groups/:groupId/calendar/:eventId
// @access  Private
const deleteCalendarEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
        res.status(404);
        throw new Error("Event not found");
    }

    // You could add an access control check here as well
    const group = await Group.findById(event.group);
    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember) {
        res.status(403);
        throw new Error("User not authorized to delete this event");
    }

    await CalendarEvent.deleteOne({ _id: eventId });

    req.io.to(event.group.toString()).emit("event:deleted", eventId);

    res.status(200).json({ message: "Event removed" });
});

export {
    createCalendarEvent,
    getGroupCalendarEvents,
    updateCalendarEvent, // NEW EXPORT
    deleteCalendarEvent // NEW EXPORT
};