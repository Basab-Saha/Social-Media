const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        data: Buffer, // For storing the image data
        contentType: String, // To store the image MIME type
    },
    createdBy: {
        type: String,
    },
    likes:{
        type:Number,
        default: 0
    },
    Dislikes:{
        type:Number,
        default: 0
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
