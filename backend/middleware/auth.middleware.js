import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

export const protectRoute=async (req,res,next)=>{
    try {
        const token=req.cookies["jwt-connectin"];
        if(!token){
            return res.status(401).json({message:"Unauthorized - No token available"});
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message:"Unauthorized - Invalid token"}); 
        }

        const user=await User.findById(decoded.userID).select("-password");
        if(!user){
            return res.status(401).json({message:"Unauthorized - User not found"});
        }

        req.user=user;

        next();
    } catch (error) {
        console.log("Error in Protect Route : middleware",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}