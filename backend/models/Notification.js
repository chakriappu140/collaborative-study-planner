import mongoose from "mongoose"

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String
    }
}, {timestamps: true})

const Notification = mongoose.model("Notification", notificationSchema)
export default Notification