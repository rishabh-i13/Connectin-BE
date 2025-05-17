import Notification from "../models/notification.model.js";
export const getUserNotifications = async (req, res) => {
    try {
        const notifications= await Notification.find({ recipients: req.user._id }).sort({ createdAt: -1 })
        .populate("relatedUser","name username profilePicture")
        .populate("relatedPost","content image");

        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in Get User Notifications", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const markNotificationAsRead = async (req, res) => {
    const notificationId = req.params.id;
  
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipients: req.user._id },
        { read: true },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
  
      return res.status(200).json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  

export const deleteNotification=async(req,res)=>{
    const notificationId=req.params.id;
    try {
        const notification = await Notification.findByIdAndDelete({
            _id:notificationId,
            recipient:req.user._id
        });  

        res.json({message:"Notification deleted successfully"});
    } catch (error) {
        console.log("Error in Delete Notification",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}
