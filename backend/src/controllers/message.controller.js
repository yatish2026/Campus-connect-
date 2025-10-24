import mongoose from 'mongoose';
import Message from '../models/message.model.js';

export const createMessage = async (req, res) => {
  try {
    const senderId = req.user._id; // Extract senderId from authenticated user
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: 'receiverId and text are required.' });
    }

    // Allow messaging between any users without connection checks
    const msg = await Message.create({ senderId, receiverId, text });
    return res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userA = req.user && req.user._id ? req.user._id : req.params.userA;
    const userB = req.params.userId;
    const messages = await Message.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA }
      ]
    }).sort('createdAt');
    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const rawUserId = req.user && req.user._id ? (typeof req.user._id === 'string' ? req.user._id : String(req.user._id)) : req.query.userId;

    if (!rawUserId) {
      console.warn('getConversations: Missing userId');
      return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!mongoose.isValidObjectId(rawUserId)) {
      console.warn('getConversations: Invalid userId provided:', rawUserId);
      return res.status(400).json({ message: 'Invalid User ID.' });
    }

  const userObjectId = new mongoose.Types.ObjectId(rawUserId);
  console.log('getConversations: Fetching conversations for userId:', rawUserId);

    const agg = await Message.aggregate([
      { $match: { $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          senderId: 1, receiverId: 1, text: 1, createdAt: 1,
          partner: {
            $cond: [
              { $eq: ['$senderId', userObjectId] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$partner',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      // join partner user info and filter out orphaned partners (users deleted)
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partnerInfo'
        }
      },
      { $match: { 'partnerInfo.0': { $exists: true } } },
      { $addFields: { partnerInfo: { $arrayElemAt: ['$partnerInfo', 0] } } },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    if (!agg || agg.length === 0) {
      console.warn('getConversations: No conversations found for userId:', rawUserId);
      return res.status(404).json({ message: 'No conversations found.' });
    }

    console.log('getConversations: Conversations fetched successfully for userId:', rawUserId);
    return res.json(agg);
  } catch (err) {
    console.error('Error in getConversations:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body; // array of message ids
    await Message.updateMany({ _id: { $in: messageIds } }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

