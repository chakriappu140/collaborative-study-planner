// backend/models/Group.js
import mongoose from "mongoose"

const groupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    inviteToken: String, // <-- NEW FIELD
    inviteTokenExpires: Date // <-- NEW FIELD
}, {timestamps: true})

const Group = mongoose.model('Group', groupSchema)
export default Group