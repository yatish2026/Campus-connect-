import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title: { type: String },
  text: { type: String, required: true },
  category: { type: String, enum: ['Aptitude', 'DSA', 'HR', 'Domain'], default: 'DSA' },
  type: { type: String, enum: ['mcq', 'open'], default: 'mcq' },
  options: [{ type: String }],
  answer: { type: mongoose.Schema.Types.Mixed }, // for mcq: index or array, for open: string
  hints: [{ type: String }],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  tags: [{ type: String }],
  approved: { type: Boolean, default: true },
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isOfficial: { type: Boolean, default: true },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Question', QuestionSchema);
