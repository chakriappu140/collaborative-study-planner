import asyncHandler from "express-async-handler"
import CalendarEvent from "../models/CalendarEvent.js"

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

export {createCalendarEvent, getGroupCalendarEvents}