import mongoose from "mongoose";

const fileSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    publicId: { // NEW FIELD for Cloudinary
        type: String,
        required: true
    }
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);
export default File;
