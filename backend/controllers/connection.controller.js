import ConnectionRequest from "../models/connectionRequest.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
// import {sendConnectionAcceptedEmail} from "../emails/emailHandlers.js";

export const sendConnectionRequest= async (req,res)=>{
    try {
        const {userId}=req.params;
        const senderId=req.user._id;

        if(senderId.toString()===userId){ //check if the user is sending a connection request to himself
            return res.status(400).json({message:"You cannot connect with yourself"});
        }

        if(req.user.connections.includes(userId)){ //check if the user is already connected with the user he is trying to connect with
            return res.status(400).json({message:"You are already connected with this user"});
        }

        const existingRequest = await ConnectionRequest.findOne(
            {
                sender:senderId,
                receiver:userId,
                status:"pending",
            }); //check if the user has already sent a connection request to the user he i
            // s trying to connect with

        if(existingRequest){
            return res.status(400).json({message:"You have already sent a connection request to this user"});
        }

        const newRequest=new ConnectionRequest({
            sender:senderId,
            recipient:userId,
        });

        await newRequest.save();

        res.status(201).json({message:"Connection request sent successfully"});
    } catch (error) {
        console.log("Error in Send Connection Request",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const acceptConnectionRequest=async(req,res)=>{
    try {
        const {requestId}=req.params;
        const userId=req.user._id;

        const request=await ConnectionRequest.findById(requestId)
        .populate("sender","name email username ")
        .populate("recipient","name username ");

        if(!request){
            return res.status(404).json({message:"Connection request not found"});
        }
        if(request.recipient._id.toString()!==userId.toString()){ //check if the user is the recipient of the connection request    
            return res.status(403).json({message:"You are not authorized to accept this connection request"});
        }
        if(request.status!=="pending"){
            return res.status(400).json({message:"Connection request is already accepted"});    
        }
        
        request.status="accepted";
        await request.save();

        //if i am your friend then your are also my friend
        await User.findByIdAndUpdate(userId,{$addToSet:{connections:request.sender._id}});
        await User.findByIdAndUpdate(request.sender._id,{$addToSet:{connections:userId}});

        const notification=new Notification({
            recipients:[request.sender._id],
            type:"connectionAccepted",
            relatedUser:userId,
        });
        await notification.save();

        //todo - send email
        // const senderEmail=request.sender.email;
        // const senderName=request.sender.name;
        // const recipientName=request.recipient.name;
        // const profileUrl=process.env.CLIENT_URL+"/profile/" +request.recipient.username;

        // try {
        //     await sendConnectionAcceptedEmail(senderEmail,senderName,recipientName,profileUrl);
        // } catch (error) {
        //     console.log("Error in Send Connection Accepted Email",error.message);
        // }

        res.status(200).json({message:"Connection request accepted successfully"});
    } catch (error) {
        console.log("Error in Accept Connection Request",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const rejectConnectionRequest=async(req,res)=>{
    try {
        const {requestId}=req.params;
        const userId=req.user._id;

        const request=await ConnectionRequest.findById(requestId);
        
        if(request.recipient.toString()!==userId.toString()){  //check if the user is the recipient of the connection request
            return res.status(403).json({message:"You are not authorized to reject this connection request"});  
        }
        
        if(request.status!=="pending"){
            return res.status(400).json({message:"Connection request is already processed"});
        }

        request.status="rejected";
        await request.save();

        res.status(200).json({message:"Connection request rejected successfully"});
        //check if the user is the recipient of the connection request
    } catch (error) {
        console.log("Error in Reject Connection Request",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const getConnectionRequests=async(req,res)=>{
    try {
        const userId=req.user._id;
        const requests=await ConnectionRequest.find({recipient:userId,status:"pending"})
        .populate("sender","name username profilePicture headline connections");

        res.status(200).json(requests);
    } catch (error) {
        console.log("Error in Get Connection Requests",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const getUserConnections=async(req,res)=>{
    try {
        const userId=req.user._id;
        const user=await User.findById(userId).populate("connections","name username profilePicture headline co  nnections");
        res.status(200).json(user.connections);
    } catch (error) {
        console.log("Error in Get User Connections",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const removeConnection=async(req,res)=>{
    try {
        const myId=req.user._id;
        const {userId}=req.params;

        await User.findByIdAndUpdate(myId,{$pull:{connections:userId}});
        await User.findByIdAndUpdate(userId,{$pull:{connections:myId}});

        res.status(200).json({message:"Connection removed successfully"});
    } catch (error) {
        
    }
}

    export const getConnectionStatus=async(req,res)=>{
        try {
            const targetUserId=req.params.userId;
            const currentUserId=req.user._id;   

            const currentUser= req.user;
            if(currentUser.connections.includes(targetUserId)){
                return res.status(200).json({status:"connected"});
            }

            const pendingRequest=await ConnectionRequest.findOne({
                $or:[
                    {sender:currentUserId,recipient:targetUserId,status:"pending"},
                    {sender:targetUserId,recipient:currentUserId,status:"pending"},
                ],
                status:"pending",
            });
            if (pendingRequest) {
                if (pendingRequest.sender.toString() === currentUserId.toString()) {
                  return res.status(200).json({ status: "requestSent" });
                } else {
                  return res.status(200).json({
                    status: "requestReceived",
                    requestId: pendingRequest._id, // This is what frontend needs to Accept/Reject
                  });
                }
              }
              

            res.status(200).json({status:"notConnected"}); 
        } catch (error) {
            console.log("Error in Get Connection Status",error.message);
            res.status(500).json({message:"Internal Server Error"});
        }
    }