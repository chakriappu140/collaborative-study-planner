import mongoose from "mongoose"

const directMessageSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: { // NEW FIELD
        type: Boolean,
        default: false
    },
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "DirectMessage", 
        default: null 
    }
}, { timestamps: true });

const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);
export default DirectMessage;