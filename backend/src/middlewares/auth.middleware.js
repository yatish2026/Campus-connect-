import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Support token passed either via cookie (jwt-ProConnect) or Authorization header (Bearer)
    let token = null;
    if (req.cookies && req.cookies['jwt-ProConnect']) {
      token = req.cookies['jwt-ProConnect'];
    } else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No Token Provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verr) {
      return res.status(401).json({ message: 'Unauthorized - Token is invalid' });
    }

    // token payload might have different naming conventions; support userId, id, or _id
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - token missing user id' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute Middleware', error);
    // If this was a transient network/TLS reset, return 503 to indicate a temporary service issue
    if (error && (error.code === 'ECONNRESET' || error.errno === -4077)) {
      return res.status(503).json({ message: 'Service unavailable - database connection reset. Please retry shortly.' });
    }
    res.status(500).json({ message: 'Something Went Wrong' });
  }
};
