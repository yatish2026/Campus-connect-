import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  attempted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  solved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  bookmarked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  bookmarkedLinks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResourceLink' }],
  dailyPoints: [{ date: String, points: Number }],
});

export default mongoose.model('UserProgress', UserProgressSchema);
