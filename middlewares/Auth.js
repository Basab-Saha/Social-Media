const { getUser } = require("../service/Auth");

async function RestrictToLoggedInUsers(req,res,next){

    // Assuming the cookie was set in a previous response and is now included in the subsequent request
const userUid = req.cookies?.uid;



    
    
    if(!userUid) return res.redirect('/login');

    const user=getUser(userUid);

    

    if(!user) return res.redirect('/login');

   

    req.user=user;
    next();
}

module.exports=RestrictToLoggedInUsers;