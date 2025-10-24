import Club from '../models/club.model.js';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';

export const listClubs = async (req, res) => {
  try {
    const clubs = await Club.find().populate('creator', 'name username profilePicture').sort({ createdAt: -1 });
    return res.json(clubs);
  } catch (err) {
    console.error('listClubs', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createClub = async (req, res) => {
  try {
    const { name, description, banner } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const club = new Club({ name, description, banner, creator: req.user._id, followers: [req.user._id], members: [req.user._id] });
    await club.save();
    return res.status(201).json(club);
  } catch (err) {
    console.error('createClub', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('creator', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate('applications.user', 'name username profilePicture');
    if (!club) return res.status(404).json({ message: 'Club not found' });
    return res.json(club);
  } catch (err) {
    console.error('getClub', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const followClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    const uid = req.user._id;
    if (club.followers.includes(uid)) {
      club.followers = club.followers.filter(f => f.toString() !== uid.toString());
      // optionally remove follow notification? skip for now
    } else {
      club.followers.push(uid);
      // create notification for club creator that someone followed the club
      try {
        const notif = new Notification({
          recipient: club.creator,
          type: 'clubFollow',
          relatedUser: uid,
          relatedClub: club._id,
        });
        await notif.save();
      } catch (nerr) {
        console.error('failed to create clubFollow notification', nerr);
      }
    }
    await club.save();
    return res.json(club);
  } catch (err) {
    console.error('followClub', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const applyClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    const { message } = req.body;
    // don't duplicate applications
    const exists = club.applications.find(a => a.user.toString() === req.user._id.toString() && a.status === 'pending');
    if (exists) return res.status(400).json({ message: 'Application already pending' });
    club.applications.push({ user: req.user._id, message, status: 'pending' });
    await club.save();
    // notify club creator about application
    try {
      const notif = new Notification({
        recipient: club.creator,
        type: 'clubApplication',
        relatedUser: req.user._id,
        relatedClub: club._id,
      });
      await notif.save();
    } catch (nerr) {
      console.error('failed to create clubApplication notification', nerr);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('applyClub', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const reviewApplication = async (req, res) => {
  try {
    const { appId, action } = req.body; // action: approve | reject
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    // only creator can review
    if (club.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    const app = club.applications.id(appId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'approve') {
      club.members.push(app.user);
      // notify applicant about approval
      try {
        const notif = new Notification({
          recipient: app.user,
          type: 'clubApplicationReview',
          relatedUser: req.user._id,
          relatedClub: club._id,
        });
        await notif.save();
      } catch (nerr) {
        console.error('failed to create clubApplicationReview notification', nerr);
      }
    }
    await club.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('reviewApplication', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const myClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ $or: [{ members: req.user._id }, { creator: req.user._id }] });
    return res.json(clubs);
  } catch (err) {
    console.error('myClubs', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getClubPosts = async (req, res) => {
  try {
    const clubId = req.params.id;
    const posts = await Post.find({ club: clubId })
      .populate('author', 'name username profilePicture headline')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    console.error('getClubPosts', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
