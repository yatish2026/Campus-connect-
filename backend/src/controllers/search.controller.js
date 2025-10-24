import User from '../models/user.model.js';
import Post from '../models/post.model.js';

export const search = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ users: [], posts: [] });
    const regex = new RegExp(q, 'i');

    const users = await User.find({ $or: [{ name: regex }, { username: regex }] }).select('name username profilePicture headline').limit(10);
    const posts = await Post.find({ $or: [{ content: regex }, { title: regex }] }).select('title content author createdAt').limit(10).populate('author', 'name username profilePicture');

    res.json({ users, posts });
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
