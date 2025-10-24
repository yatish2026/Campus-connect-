import dotenv from 'dotenv';
import { connectDB } from '../src/lib/db.js';
import Message from '../src/models/message.model.js';
import Post from '../src/models/post.model.js';
import Notification from '../src/models/notification.model.js';
import ResourceLink from '../src/models/resourceLink.model.js';

dotenv.config();

const clean = async () => {
  try {
    await connectDB();

    console.log('Removing all messages...');
    await Message.deleteMany({});

    console.log('Removing all posts...');
    await Post.deleteMany({});

    console.log('Removing all notifications...');
    await Notification.deleteMany({});

    console.log('Removing resource links (optional demo data)...');
    await ResourceLink.deleteMany({});

    console.log('Clean complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during clean:', err);
    process.exit(1);
  }
};

clean();
