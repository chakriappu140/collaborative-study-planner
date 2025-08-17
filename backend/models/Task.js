import mongoose from "mongoose"

const taskSchema = mongoose.Schema({
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
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        required: true,
        enum: ['To Do', 'In Progress', 'Done'],
        default: "To Do"
    },
    dueDate: {
        type: Date
    },
    priority: { // NEW FIELD
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    }
}, {timestamps: true})

const Task = mongoose.model("Task", taskSchema)
export default Task
