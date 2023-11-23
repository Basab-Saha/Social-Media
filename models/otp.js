const mongoose=require("mongoose");

const otpSchema=new mongoose.Schema({
    val:{
        type:String,
        required:true,
        unique:true,
    },
    created_at: { type: Date, default: Date.now },
    created_by:{
        type:String,
        required:true,
    }
})

const OTP=mongoose.model("otp",otpSchema);

module.exports=OTP;