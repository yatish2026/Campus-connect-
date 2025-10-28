import User from '../models/user.model.js';
import Post from '../models/post.model.js';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const search = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ users: [], posts: [] });
    const escapedQ = escapeRegExp(q);
    const regex = new RegExp(escapedQ, 'i');

    const users = await User.find({ $or: [{ name: regex }, { username: regex }] }).select('name username profilePicture headline').limit(10);
    const posts = await Post.find({ $or: [{ content: regex }] }).select('content author createdAt').limit(10).populate('author', 'name username profilePicture');

    res.json({ users, posts });
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
