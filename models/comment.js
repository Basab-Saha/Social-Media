const mongoose=require("mongoose");

const commentSchema=new mongoose.Schema({
    content:{
        type:String,
        require:true,
    },
    commentedBy:{
        type:String,
        required:true,

    },
    onWhichPost:{
        type: mongoose.Schema.Types.ObjectId, // Reference to the post/note
        ref: 'Note' // Referring to the 'Note' model
    },
    commentedAt:{
        type:Date,
        default:Date.now(),
    }
    
});

const Comment=mongoose.model("comment",commentSchema);

module.exports=Comment;