import mongoose from "mongoose"

const messageSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, {timestamps: true})

const Message = mongoose.model("Message", messageSchema)
export default Message;