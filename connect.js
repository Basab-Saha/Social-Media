const mongoose=require("mongoose");

async function ConnectToMongoDb(url){
    return mongoose.connect(url).then(()=>{
        console.log("MongoDB Connected");
    }).catch((err)=>{
        console.log(err);
    })
}

module.exports=ConnectToMongoDb;