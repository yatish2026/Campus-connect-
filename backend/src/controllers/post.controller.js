import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Club from '../models/club.model.js';

export const getFeedPosts = async (req, res) => {
  try {
    // include posts from user's connections and posts from clubs the user follows
    const followedClubs = await Club.find({ followers: req.user._id }).select('_id');
    const clubIds = followedClubs.map(c => c._id);

    const posts = await Post.find({
      $or: [
        { author: { $in: [...req.user.connections, req.user._id] } },
        { club: { $in: clubIds } }
      ]
    })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getFeedPosts controller:", error);
    if (error && (error.code === 'ECONNRESET' || error.errno === -4077)) {
      return res.status(503).json({ message: 'Service unavailable - transient network error' });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image, clubId } = req.body;

    let newPost;
    //resim var mi yok mu ona gore postu oluştururken değiştiriyoruz
    // if posting to a club, verify membership
    if (clubId) {
      const club = await Club.findById(clubId);
      if (!club) return res.status(404).json({ message: 'Club not found' });
      const isMember = club.members.map(m => m.toString()).includes(req.user._id.toString());
      const isCreator = club.creator.toString() === req.user._id.toString();
      if (!isMember && !isCreator) return res.status(403).json({ message: 'Must be a club member to post' });
    }

    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      newPost = new Post({
        author: req.user._id,
        content,
        image: imgResult.secure_url,
        club: clubId || null,
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content,
        club: clubId || null,
      });
    }

    await newPost.save();
    // if club post, notify club followers (and/or club creator)
    if (clubId) {
      try {
        const club = await Club.findById(clubId).select('followers creator');
        const recipients = new Set([...(club.followers || []).map(f => f.toString())]);
        // avoid notifying the author
        recipients.delete(req.user._id.toString());
        for (const r of recipients) {
          const notif = new Notification({
            recipient: r,
            type: 'clubPost',
            relatedUser: req.user._id,
            relatedPost: newPost._id,
            relatedClub: clubId,
          });
          await notif.save();
        }
      } catch (nerr) {
        console.error('failed to create clubPost notifications', nerr);
      }
    }
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error in createPost controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post Not Found" });
    }
    //check if the current user is the author(own) of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized for delete post" });
    }

    //delete the image from cloudinary
    if (post.image) {
      await cloudinary.uploader.destroy(
        post.image.split("/").pop().split(".")[0] //!image urlsindeki idye bu şekilde ulaştık (.png den önceki kısım)
      );
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture username headline");

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in getPostById controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select("_id");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ author: user._id })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPostsByUser controller:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            user: req.user._id,
            content,
          },
        },
      },
      { new: true }
    ).populate("author", "name email username headline profilePicture");

    //!create a notification if the comment owner is not the post owner
    if (post.author._id.toString() !== req.user._id.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: "comment",
        relatedUser: req.user._id,
        relatedPost: postId,
      });
      await newNotification.save();
      //!send email
      try {
        const postUrl = process.env.CLIENT_URL + /post/ + postId;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          req.user.name,
          postUrl,
          content
        );
      } catch (error) {
        console.log("Error in sending comment notification email", error);
      }
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Error in createComment controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      //!UNLIKE THE POST
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      //!LIKE THE POST
      post.likes.push(userId);
    }
    //!create a notification if the post owner isn't the user who liked
    if (post.author.toString() !== userId.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: "like",
        relatedUser: userId,
        relatedPost: postId,
      });
      await newNotification.save();
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("Error in getPostById controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
