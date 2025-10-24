import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../src/models/question.model.js';
import { connectDB } from '../src/lib/db.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  const examples = [
    { text: 'What is the next number in the series: 2, 4, 8, 16, ?', category: 'Aptitude', type: 'open', answer: '32', hints: ['Powers of 2'], difficulty: 'Easy' },
    { text: 'Reverse the string "hello".', category: 'DSA', type: 'open', answer: 'olleh', hints: [], difficulty: 'Easy' },
    { text: 'Which data structure uses LIFO?', category: 'DSA', type: 'mcq', options: ['Queue', 'Stack', 'Tree', 'Graph'], answer: 1, hints: ['Think last-in first-out'], difficulty: 'Easy' },
    { text: 'How would you handle a conflict with a teammate?', category: 'HR', type: 'open', answer: '', hints: ['Be specific, show collaboration'], difficulty: 'Medium' }
  ];
  for (const e of examples) {
    await Question.create(e);
  }
  console.log('Seeded questions');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
