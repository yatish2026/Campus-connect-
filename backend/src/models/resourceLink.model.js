import mongoose from 'mongoose';

const ResourceLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  topic: { type: String, required: true }, // e.g. 'dsa', 'aptitude', 'tech'
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ResourceLink', ResourceLinkSchema);
