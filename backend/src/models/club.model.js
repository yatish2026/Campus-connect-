import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  banner: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applications: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

const Club = mongoose.model('Club', clubSchema);
export default Club;
