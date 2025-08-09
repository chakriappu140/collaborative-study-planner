import mongoose from "mongoose"

const calendarEventSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
}, {timestamps: true})

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema)
export default CalendarEvent;