import dotenv from 'dotenv';
import { connectDB } from '../src/lib/db.js';
import ResourceLink from '../src/models/resourceLink.model.js';

dotenv.config();

const links = [
  { title: 'GFG 160 Problems (Chapters)', url: 'https://www.geeksforgeeks.org/batch/gfg-160-problems?tab=Chapters', topic: 'dsa' },
  { title: "Striver's A2Z DSA Sheet", url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2', topic: 'dsa' },
  { title: 'Skill-Up Full Stack Web Development', url: 'https://www.geeksforgeeks.org/batch/skill-up-full-stack-web-development', topic: 'tech' },
  { title: 'AI/ML & Data Science Tutorial', url: 'https://www.geeksforgeeks.org/machine-learning/ai-ml-and-data-science-tutorial-learn-ai-ml-and-data-science/', topic: 'tech' }
];

const seed = async () => {
  await connectDB();
  for (const l of links) {
    await ResourceLink.create(l);
  }
  console.log('Seeded links');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
