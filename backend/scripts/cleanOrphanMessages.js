import dotenv from 'dotenv';
import { connectDB } from '../src/lib/db.js';
import Message from '../src/models/message.model.js';
import User from '../src/models/user.model.js';

dotenv.config();

const cleanOrphanMessages = async () => {
  try {
    await connectDB();

    console.log('Looking for messages with missing sender or receiver users...');

    // Aggregate messages where sender or receiver does not have a corresponding user doc
    const orphanAgg = await Message.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiverId',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      {
        $match: {
          $or: [
            { 'sender.0': { $exists: false } },
            { 'receiver.0': { $exists: false } }
          ]
        }
      },
      { $project: { _id: 1 } }
    ]);

    if (!orphanAgg || orphanAgg.length === 0) {
      console.log('No orphaned messages found. Nothing to delete.');
      process.exit(0);
    }

    const orphanIds = orphanAgg.map(d => d._id);
    console.log(`Found ${orphanIds.length} orphaned message(s). Deleting...`);

    const res = await Message.deleteMany({ _id: { $in: orphanIds } });
    console.log(`Deleted ${res.deletedCount || 0} orphaned message(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Error during orphan message cleanup:', err);
    process.exit(1);
  }
};

cleanOrphanMessages();
