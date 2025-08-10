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
    }
}, {timestamps: true})

const Group = mongoose.model('Group', groupSchema)
export default Group