import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";

//!SUGGESTIONS
export const getSuggestedConnections = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("connections");

    //?find users who are not already connected and also dont recommend our own profile
    const suggestedUser = await User.find({
      _id: {
        $ne: req.user._id, //not equal to current user
        $nin: currentUser.connections, //not in
      },
    })
      .select("name username profilePicture headline")
      .limit(5); //fetch işleminde önerilecek kişilerin bilgilerini fetch etmek icin select ekledik  ve toplam kaç kullanıcı gösterileceğini limit ile belirledik

    res.json(suggestedUser);
  } catch (error) {
    console.error("Error in getSuggestedConnections controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//! GET PUBLIC PROFILE
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getPublicProfile controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//!UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "username",
      "headline",
      "about",
      "location",
      "profilePicture",
      "bannerImg",
      "skills",
      "experience",
      "education",
      // allow social links and projects to be updated from profile edit
      "linkedin",
      "github",
      "projects",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (req.body[field]) {
        updatedData[field] = req.body[field];
      }
    }

    //!check for the profile image and bannerImg (cloudinary)
    if (req.body.profilePicture) {
      const result = await cloudinary.uploader.upload(req.body.profilePicture);
      updatedData.profilePicture = result.secure_url;
    }
    if (req.body.bannerImg) {
      const result = await cloudinary.uploader.upload(req.body.bannerImg);
      updatedData.bannerImg = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: updatedData,
      },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStatus = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select('isOnline lastSeen');
    if (!u) return res.status(404).json({ message: 'User not found' });
    return res.json(u);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get user by Mongo ID (used by frontend fallbacks)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('Error in getUserById controller:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
