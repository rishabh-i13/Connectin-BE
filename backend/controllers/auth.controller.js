import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeMail } from "../emails/emailHandlers.js";

//SignUp controller
export const signup= async (req,res)=>{
    try {
        const {name,username,email,password}=req.body;

        if(!name || !username || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        const existingEmail=await User.findOne({email}); // check if email already exist in the database
        if(existingEmail){
            return res.status(400).json({message:"Email already exists"});
        }

        const existingUsername=await User.findOne({username}); // check if username already exist in the database
        if(existingUsername){
            return res.status(400).json({message:"Username already exists"});
        }

        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters"});
        }

        const salt= await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const user=new User({
            name,
            username,
            email,
            password:hashedPassword
        })

        await user.save();

        const token=jwt.sign({userID:user._id},process.env.JWT_SECRET,{expiresIn:"3d"});
        res.cookie("jwt-connectin",token,
            {
                httpOnly:true, //prevents client side js from accessing the cookie k/a XSS attack
                maxAge:3*24*60*60*1000,
                sameSite:"strict", //prevents CSRF attack
                secure:process.env.NODE_ENV==="production"
            });

        res.status(201).json({message:"User created successfully"});  

        //send welcome mail

        const profileURL=process.env.CLIENT_URL+"/profile/" +user.username;

        // try {
        //     await sendWelcomeMail(user.email,user.name,profileURL);
        // } catch (emailError) {
        //     console.error("Error Sending Welcome Mail",emailError);
        // }

    } catch (error) {
        console.log("Error in SignUp",error.message)
        res.status(500).json({message:"Internal Server Error"});
    }
}

//Login controller
export const login = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
      });
  
      // Check if user exists
      if (!user) {
        return res.status(400).json({ message: "User does not exist" });
      }
  
      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3d",
      });      
  
      res.cookie("jwt-connectin", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
  
      res.status(200).json({ message: "Login successful" });
  
    } catch (error) {
      console.log("Error in Login", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  

//Logout controller
export const logout=(req,res)=>{
    res.clearCookie("jwt-connectin");
    res.status(200).json({message:"Logout successful"});
}

export const getCurrentUser=(req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in Get Current User",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}