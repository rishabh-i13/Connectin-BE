import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
// import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import { v2 as cloudinary } from "cloudinary";


//OLDER ONE
// export const getFeedPosts = async (req, res) => {
//   try {
//     const posts = await Post.find({
//       author: { $in: [...req.user.connections, req.user._id] },
//     })
//       .populate("author", "name username profilePicture headline")
//       .populate("comments.user", "name profilePicture")
//       .sort({ createdAt: -1 });
//     res.status(200).json(posts);
//   } catch (error) {
//     console.log("Error in Get Feed Posts", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

//NEW ONE FOR PAGINATION
export const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      author: { $in: [...req.user.connections, req.user._id] },
    })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({
      author: { $in: [...req.user.connections, req.user._id] },
    });

    res.status(200).json({
      posts,
      hasMore: skip + posts.length < totalPosts,
    });
  } catch (error) {
    console.log("Error in Get Feed Posts", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    let newPost;
    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      newPost = new Post({
        author: req.user._id,
        content,
        image: imgResult.secure_url,
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content,
      });
    }
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in Create Post", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== userId.toString()) {
      // check if the current use is the author or not
      return res.status(403).json({ message: "You are not Unauthorized" });
    }
    if (post.image) {
      //to do later
      const imgId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in Delete Post", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name username profilePicture");

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in Get Post By Id", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { user: req.user._id, content } },
      },
      {
        new: true,
      }
    )
      .populate("author", "name username email profilePicture")
      .populate("comments.user", "name username profilePicture");
    res.status(201).json({
      message: "Comment created successfully",
      post,
    });

    // create a notification if the comment is not the author of the post
    if(post.author._id.toString()!==req.user._id.toString()){
        const newNotification=new Notification({
            recipients:[post.author],
            type:"comment",
            relatedUser:req.user._id,
            relatedPost:postId,
        });
        await newNotification.save();

        //todo send email to the author
        // try {
        //   const postUrl= process.env.CLIENT_URL+"/post/"+postId;
        //   await sendCommentNotificationEmail(post.author.email,post.author.name,req.user.name,postUrl,comment);
        // } catch (error) {
        //   console.log("Error in Send Comment Notification Email",error.message);
        // }
    }
  } catch (error) {
    console.log("Error in Create Comment", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check authorization: either post author or comment author
    if (
      comment.user.toString() !== userId.toString() &&
      post.author.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete comment" });
    }

    // Use $pull to remove the comment
    post.comments.pull(commentId);
    await post.save();

    // Get the updated post
    const updatedPost = await Post.findById(postId)
      .populate("author", "name username email profilePicture")
      .populate("comments.user", "name username profilePicture");

    res.status(200).json({
      message: "Comment deleted successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.log("Error in Delete Comment", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      //remove the like
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      //add the like
      post.likes.push(userId);
      //create a notification if someone other than owner liked the post
      if (post.author.toString() !== userId.toString()) {
        const newNotification = new Notification({
          recipients: [post.author],
          type: "like",
          relatedUser: userId,
          relatedPost: postId,
        });
        await newNotification.save();
      }

      await post.save();
      res.status(200).json(post);
    }
  } catch (error) {
    console.log("Error in Like Post", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      //remove the like
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await post.save();
      res.status(200).json(post);
    }
  } catch (error) {
    console.log("Error in Removing Like from Post", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in Get Posts By User ID", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

