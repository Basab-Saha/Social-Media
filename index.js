const express=require("express");
const app=express();

const mongoose=require("mongoose")

const path=require("path")
const ConnectToMongoDb=require("./connect");
const User=require("./models/user");
const cookieParser=require("cookie-parser");
const nodemailer = require('nodemailer');
const shortid = require('shortid');

const {v4:uuidv4}=require("uuid");
const { setUser, getUser } = require("./service/Auth");
const RestrictToLoggedInUsers = require("./middlewares/Auth");
const Note = require("./models/note");
const OTP = require("./models/otp");
const fs=require("fs")

const multer=require("multer");
const Comment = require("./models/comment");
const Cart = require("./models/cart");

app.set("view engine","ejs");
app.set("views",path.resolve('./views'))

ConnectToMongoDb("mongodb://127.0.0.1:27017/BlogApp")
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

//multer logics//---------



////----------

app.get("/home",RestrictToLoggedInUsers ,async (req, res) => {
    const name = req.query.name;
    const curr_uid=req.cookies?.uid;
    const curr_user_obj=getUser(curr_uid);
    const curr_user_name=curr_user_obj.username

   

   
    if(name===curr_user_name){
        const allNotes=await Note.find({createdBy:req.user.email});
        const allUsersNotes=await Note.find({});
        return res.render("Home", { name : name ,allNotes,allUsersNotes });
    }
    else{
        if(!req.query.Purpose){
            const x="Can't access this Profile , Sorry"
            return res.redirect(`/fail?err=${x}`);
        }
        else{
            return res.redirect("/login")
        }
       
    }
   
});

const sendGreetingsEmail = async (userEmail, userName) => {
    try {
        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // use SSL
            service: 'Your email service provider',
            auth: {
                user: '2021ugcs054@nitjsr.ac.in',
                pass: 'kvun kuno kbyv oxyz',
            },
        });

        // Email content
        const mailOptions = {
            from: '2021ugcs054@nitjsr.ac.in',
            to: userEmail,
            subject: 'Welcome to Our App!',
            text: `Subject: Basab's Warm Welcome to [Your Company Name]!❤️

            Dear ${userName},
            
            It is with great pleasure❤️ that we extend a warm welcome to you at Zap Notes⚡ created by 👑 BASAB 👑. We're thrilled that you've chosen to join our community of Zappers ⚡.`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Greetings email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};




app.get("/signup",(req,res)=>{
     res.render("signup")
})

app.get("/login",async(req,res)=>{
    await OTP.deleteMany({});
    res.render("login")
})

app.post("/users",async(req,res)=>{
    const new_user=req.body;
    if(!new_user.username || !new_user.email || !new_user.password){
        const x="Please fill all details"
       return res.redirect(`/fail?err=${x}`);
       
    }

    const alreadyExists=await User.findOne({email:new_user.email});

    if(alreadyExists){
        //go to fail page with : [ user already exists];
        const x="User already exists"
        return res.redirect(`/fail?err=${x}`);
    }
    else{
        await User.create({
            username:new_user.username,
            email:new_user.email,
            password:new_user.password,
        })

        await sendGreetingsEmail(new_user.email, new_user.username);

       const name = new_user.username;
        return res.redirect(`/home?name=${name}&Purpose=Signup`);
    }
})

app.post("/users/login",async(req,res)=>{
    const old_user=req.body;
    if( !old_user.email || !old_user.password){
        const x="Please fill all details"
        return res.redirect(`/fail?err=${x}`);  //return dewa important
    }
    const valid_user=await User.findOne({email:old_user.email,password:old_user.password});
    if(!valid_user){
        const x="No Account Found! Please Signup"
       return res.redirect(`/fail?err=${x}`);
    }
    else{

        const sessionId=uuidv4();
        setUser(sessionId,valid_user);
        res.cookie("uid",sessionId);
       
        const name = valid_user.username;
        return res.redirect(`/home?name=${name}`);
        
    }
})
app.get("/success",(req,res)=>{
    res.render("success");
})

app.get("/fail",(req,res)=>{
    const error=req.query.err;
    res.render("fail",{error});
})

/////----------------------------------------------

app.use(express.static(path.join(__dirname, 'public')));



const upload = multer({ dest: 'uploads/' }); // define the 'uploads' directory for file storage

app.post("/notes", RestrictToLoggedInUsers, upload.single('image'), async (req, res) => {
    try {
        const userExists = await User.findOne({ email: req.user.email });
        if (userExists) {
            const newNote = new Note({
                title: req.body.title,
                content: req.body.content,
                image: {
                    data: fs.readFileSync(req.file.path), // Read the file from the path
                    contentType: req.file.mimetype
                },
                createdBy: req.user.email,
                created_at: Date.now(),
                updated_at: Date.now(),
            });

            await newNote.save();

            return res.redirect("/madeNotes");
        } else {
            const x = "No Account Found! Please Signup";
            return res.redirect(`/fail?err=${x}`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error storing note with image");
    }
});

app.get('/notes/:id/image', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note && note.image && note.image.data && note.image.contentType) {
            res.set('Content-Type', note.image.contentType);
            res.send(note.image.data);
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


////////-----------------------------------




app.get("/madeNotes",RestrictToLoggedInUsers,async(req,res)=>{
    const allNotes=await Note.find({createdBy:req.user.email})
    const name=req.user.username;

     const allUsersNotes=await Note.find({});
        return res.render("Home", { name : name ,allNotes,allUsersNotes });
})

app.delete('/notes/:_id',RestrictToLoggedInUsers, async (req, res) => {

    const curr_user_email=req.user.email;
    const userExists=await User.findOne({email:curr_user_email});
    if(userExists){
        const noteId = req.params._id; // Get the note ID from the request parameters

    try {
        // Use the correct variable name, noteId, in the deletion operation
        await Note.deleteOne({ _id: noteId });

        // Redirect or send a success response after deletion
        return res.redirect('/madeNotes');
    } catch (error) {
        // Handle errors, if any
        console.error('Error deleting note:', error);
        // Send an error response or redirect as needed
        return res.status(500).send('Error deleting note');
    }
    }
    else{
        const x="No Account Found! Please Signup"
        return res.redirect(`/fail?err=${x}`);
    }

    
});

// Example of an update route
app.get('/notes/:id',RestrictToLoggedInUsers, async(req, res) => {
    const noteId = req.params.id;
    // Fetch the note with the given ID from the database or data source
    // Then render a form to update the note
    const curr_user_email=req.user.email;
    const userExists=await User.findOne({email:curr_user_email});
    if(userExists){
        res.render("updateNote",{noteId}); // Render an update form passing the note's ID
    }
    else{
        const x="No Account Found! Please Signup"
        return res.redirect(`/fail?err=${x}`);
    }
    
});

app.post('/notes/:id',RestrictToLoggedInUsers ,async (req, res) => {
    const noteId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).send('Invalid note ID');
    }

    const updatedTitle = req.body.updatedTitle; 
    const updatedContent = req.body.updatedContent; 

    try {
        const that_note = await Note.findById(noteId);

        if (!that_note) {
            return res.status(404).send('Note not found');
        }

        that_note.title = updatedTitle;
        that_note.content = updatedContent;

        await that_note.save();

        
        return res.redirect("/sucessfullUpdate");
    } catch (error) {
        console.error(error);
        return res.json({err:"ERROR "});
    }
});

app.get("/sucessfullUpdate",RestrictToLoggedInUsers,async(req,res)=>{
    const curr_user_name=req.user.username

    const allNotes=await Note.find({createdBy:req.user.email});
    const allUsersNotes=await Note.find({});
    return res.render("Home", { name : curr_user_name ,allNotes,allUsersNotes });
})


app.get("/logout",(req,res)=>{
    res.clearCookie('uid');
    res.redirect('/home');
})

app.get("/forgot-password",(req,res)=>{

    res.render("forget")
})



const sendOTP = async (userEmail, otp) => {
    try {
        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // use SSL
            service: 'Your email service provider',
            auth: {
                user: '2021ugcs054@nitjsr.ac.in',
                pass: 'kvun kuno kbyv oxyz',
            },
        });

        // Email content
        const mailOptions = {
            from: '2021ugcs054@nitjsr.ac.in',
            to: userEmail,
            subject: `OTP Verification for ${userEmail} `,
            text: ` OTP is ${otp.val}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Greetings email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


app.post("/otp",async(req,res)=>{

    //create a otp in DB with curr time 
    const newOTP=await OTP.create({
        val:shortid(4),
        created_at:Date.now(),
        created_by:req.body.email,

    })

    sendOTP(req.body.email,newOTP);

    //and redirect user to typeOTP.ejs
    return res.redirect(`/giveOTP?email=${req.body.email}`);

})

app.get("/giveOTP",(req,res)=>{
    //query te email thakte hobe
    const userMail=req.query.email;

    return res.render("giveOTP",{email:userMail});
})

const isTimeValid = (otp) => {
    const currentTime = Date.now();
    const otpTime = otp.created_at;
    const timeDifference = currentTime - otpTime;
    const timeLimit = 600000; // 1 minute in milliseconds

    return timeDifference <= timeLimit;
};


app.post("/verify-otp",async(req,res)=>{

    const userMail=req.query.email;

    const typedOTP=req.body.otp;
    const actualOTP=await OTP.findOne({created_by:userMail});
    if(typedOTP===actualOTP.val && isTimeValid(actualOTP)){
        await OTP.deleteOne({created_by:req.query.email});
        console.log("All process sucessful!!")
        return res.redirect(`/changePass?email=${req.query.email}`);
    }
    else{
        await OTP.deleteOne({created_by:req.query.email});
        const x="WRONG OTP."
        return res.redirect(`/fail?err=${x}`);
    }

})

app.get("/changePass",(req,res)=>{
    const userMail=req.query.email;
    res.render("changePass" ,{email:userMail})
})

app.post("/updatePass", async (req, res) => {
    const userMail = req.query.email;
    
    try {
        // Find the user by email
        const user = await User.findOne({ email: userMail });

        // Update the password if the user is found
        if (user) {
            user.password = req.body.confirmNewPassword; // Assuming confirmNewPassword is the updated password
            await user.save(); // Save the updated user with the new password

            console.log("Password changed");
            return res.redirect("/login");
        } else {
            // Handle if the user is not found
            const x = "User not found";
            return res.redirect(`/fail?err=${x}`);
        }
    } catch (error) {
        console.error("Error updating password:", error);
        const x = "Error updating password";
        return res.redirect(`/fail?err=${x}`);
    }
});


app.get("/notes/:id/like", RestrictToLoggedInUsers, async (req, res) => {
    try {
        const noteId = req.params.id;
        const thatSpecificNote = await Note.findOne({ _id: noteId });

        if (thatSpecificNote) {
            thatSpecificNote.likes = (thatSpecificNote.likes || 0) + 1; // Increment likes by 1
            await thatSpecificNote.save();
            res.redirect("/madeNotes");
        } else {
            // If the note is not found, handle this situation
            res.status(404).send("Note not found");
        }
    } catch (error) {
        // Handle other potential errors (e.g., database connection issues, etc.)
        console.error("Error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/notes/:id/view", RestrictToLoggedInUsers,async(req,res)=>{
    const noteId=req.params.id;
    const requiredNote=await Note.findOne({_id:noteId})
    const allComments=await Comment.find({onWhichPost:noteId});
    res.render("viewNote",{requiredNote:requiredNote,allPostComments:allComments});
})

app.post("/notes/:id/comments", RestrictToLoggedInUsers, async (req, res) => {
    const whoCommented = req.user.username;
    const content = req.body.comment;
    const noteId = req.params.id;

    try {
        const newComment = await Comment.create({
            content:content,
            commentedBy: whoCommented,
            onWhichPost: noteId,
            commentedAt: Date.now(),
        });

        res.redirect(`/notes/${noteId}/view`); // Corrected redirect URL
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding comment");
    }
});


app.get("/cart/:id/add", RestrictToLoggedInUsers, async (req, res) => {
    const noteId = req.params.id;
    
    try {
        let user_cart = await Cart.findOne({ user: req.user.email });

        if (!user_cart) {
            user_cart = await Cart.create({ user: req.user.email, items: [] });
        }

        user_cart.items.push(noteId);

        // Save the changes to the cart
        await user_cart.save();

        res.redirect("/madeNotes");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding the note to the cart");
    }
});

app.get("/cart", RestrictToLoggedInUsers, async (req, res) => {
    const WhoseCart = req.user.email;
    const User_Cart = await Cart.findOne({ user: WhoseCart }).populate('items');

    if (!User_Cart) {
        User_Cart = await Cart.create({ user: req.user.username, items: [] });
    }

    const cartItems = User_Cart.items;

    // Fetch the details for each item in the cart
    const itemsWithDetails = await Promise.all(cartItems.map(async (itemId) => {
        const itemDetails = await Note.findById(itemId);
        return itemDetails;
    }));

    res.render("Cart", { cartItems: itemsWithDetails });
});


app.listen(1000,async()=>{
    await OTP.deleteMany({});
    console.log("Server started at PORT 1000");
})