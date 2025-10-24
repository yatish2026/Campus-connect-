import React, { useState } from 'react';
import { ExternalLink, BookOpen, Cpu, Command, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const topics = [
  { id: 'aptitude', title: 'Aptitude', icon: BookOpen, gradient: 'from-purple-500 to-indigo-500' },
  { id: 'dsa', title: 'DSA', icon: Command, gradient: 'from-rose-500 to-pink-500' },
  { id: 'hr', title: 'HR / Interview Prep', icon: Users, gradient: 'from-green-400 to-teal-500' },
  { id: 'daily', title: 'Daily Practice', icon: Clock, gradient: 'from-yellow-400 to-orange-500' },
  { id: 'tech', title: 'Technical Skills', icon: Cpu, gradient: 'from-sky-400 to-cyan-500' }
];

const LINKS = {
  aptitude: [
    { title: 'Aptitude & Reasoning Skill-Up Course', url: 'https://www.geeksforgeeks.org/courses/aptitude-and-reasoning-skill-up' }
  ],
  dsa: [
    { title: "Striver’s A2Z DSA Course Sheet", url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2' },
    { title: 'GFG 160 Problems', url: 'https://www.geeksforgeeks.org/batch/gfg-160-problems' },
    { title: 'Skill-Up DSA Course', url: 'https://www.geeksforgeeks.org/batch/skill-up-dsa' }
  ],
  hr: [
    { title: 'GFG Interview Corner', url: 'https://www.geeksforgeeks.org/interview-prep/interview-corner/' },
    { title: 'Interview Q&A Skill-Up', url: 'https://www.geeksforgeeks.org/courses/interview-qna-skill-up' },
    { title: 'Technical Interview Questions Batch', url: 'https://www.geeksforgeeks.org/batch/skill-up-technical-interview-questions?tab=Chapters' }
  ],
  daily: [
    { title: 'LeetCode', url: 'https://leetcode.com' }
  ],
  tech: [
    { title: 'Full Stack Web Development Skill-Up', url: 'https://www.geeksforgeeks.org/batch/skill-up-full-stack-web-development?tab=Chapters', tag: 'Web Development' },
    { title: 'Cyber Security Skill-Up', url: 'https://www.geeksforgeeks.org/batch/skill-up-cyber-security?tab=Chapters', tag: 'Cybersecurity' },
    { title: 'AI/ML & Data Science Tutorial', url: 'https://www.geeksforgeeks.org/machine-learning/ai-ml-and-data-science-tutorial-learn-ai-ml-and-data-science/', tag: 'AI / ML / DS' }
  ]
};

const Card = ({ t, onOpen }) => {
  const Icon = t.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(t.id)}
      className={`relative overflow-hidden rounded-2xl shadow-lg focus:outline-none h-40 p-5 flex flex-col justify-between text-white bg-gradient-to-r ${t.gradient}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold drop-shadow-md">{t.title}</div>
          <Icon className="opacity-90" />
        </div>
        <p className="text-sm opacity-90 mt-2">Curated resources & practice links</p>
      </div>
      <div className="text-xs bg-white/20 px-3 py-1 rounded-full inline-flex items-center gap-2">Explore <ExternalLink size={14} /></div>
    </motion.button>
  );
};

const Modal = ({ open, onClose, items, title }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">Open links in a new tab.</p>
          </div>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {items.map((it, i) => (
            <a key={i} href={it.url} target="_blank" rel="noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold">{it.title}</div>
                {it.tag && <div className="text-xs text-gray-500 mt-1">{it.tag}</div>}
              </div>
              <ExternalLink className="text-gray-500" />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default function InterviewPage() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const handleOpen = (id) => { setActive(id); setOpen(true); };
  const handleClose = () => { setOpen(false); setActive(null); };

  const items = active ? LINKS[active] || [] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Interview Dashboard</h1>
        <p className="text-gray-500 mt-1">Curated resources and daily practice to level up.</p>
      </header>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map(t => (
            <Card key={t.id} t={t} onOpen={handleOpen} />
          ))}
        </div>
      </section>

      <Modal open={open} onClose={handleClose} items={items} title={topics.find(x => x.id === active)?.title || 'Resources'} />
    </div>
  );
}

