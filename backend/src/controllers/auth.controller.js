import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !password || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "Username already exists" });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, username, email, password: hashedPassword });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });
    res.cookie("jwt-ProConnect", token, {
      httpOnly: true, //prevent xss attacks
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      // allow cross-site cookies in dev. Use 'lax' to permit top-level navigations.
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ message: "User registered successfully" });
    //! send welcome email
    const profileUrl = process.env.CLIENT_URL + "/profile/" + user.username;

    try {
      await sendWelcomeEmail(user.email, user.name, profileUrl);
    } catch (emailError) {
      console.log("Error sending welcome email", emailError);
    }
  } catch (error) {
    console.error("Error in signup", error.message);
    return res.status(500).json({ message: "Something Went Wrong" });
  }
};
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    //! Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //! Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //! Create and send token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });
    await res.cookie("jwt-ProConnect", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Login Error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt-ProConnect");
  res.json({ message: "Logged out succesfully" });
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error in getCurrentUser controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    
    if (!response.ok) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    const tokenInfo = await response.json();

    // Find or create user
    let user = await User.findOne({ email: tokenInfo.email });
    
    if (!user) {
      // Create new user from Google data
      user = new User({
        name: tokenInfo.name,
        email: tokenInfo.email,
        username: tokenInfo.email.split('@')[0],
        avatar: tokenInfo.picture,
        // Set a random password since we're using Google auth
        password: await bcrypt.hash(Math.random().toString(36), 10),
      });
      await user.save();
    }

    // Create JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // Set cookie
    res.cookie("jwt-ProConnect", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === "production",
    });

    // Send response with user data and token
    res.status(200).json({
      message: "Google authentication successful",
      user,
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};
