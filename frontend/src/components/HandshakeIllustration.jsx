import React from 'react';
import { motion } from 'framer-motion';

const HandshakeIllustration = ({ className = '' }) => {
  const handVariants = {
    initial: { x: -6, rotate: -6 },
    animate: {
      x: [-6, 0, -4, 0],
      rotate: [-6, 0, -3, 0],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  const rightHandVariants = {
    initial: { x: 6, rotate: 6 },
    animate: {
      x: [6, 0, 4, 0],
      rotate: [6, 0, 3, 0],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }
    }
  };

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <div className="max-w-md w-full rounded-xl p-6 bg-cc-surface dark:bg-cc-darkblue shadow-md">
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 300 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* left person */}
            <g transform="translate(50,20)">
              <circle cx="18" cy="18" r="14" fill="#93c5fd" />
              <rect x="6" y="36" width="24" height="36" rx="6" fill="#60a5fa" />
            </g>

            {/* right person */}
            <g transform="translate(210,20)">
              <circle cx="18" cy="18" r="14" fill="#c7d2fe" />
              <rect x="6" y="36" width="24" height="36" rx="6" fill="#6366f1" />
            </g>

            {/* hands - grouped so we can animate halves */}
            <g transform="translate(110,56)">
              <motion.g variants={handVariants} initial="initial" animate="animate">
                <path d="M-20 0 C -4 -4, -2 -6, 10 -2 L 30 8 L 24 18 L 8 10 Z" fill="#fce7f3" stroke="#e6e6e6" />
              </motion.g>
              <motion.g variants={rightHandVariants} initial="initial" animate="animate">
                <path d="M60 0 C 44 -4, 42 -6, 30 -2 L 10 8 L 16 18 L 32 10 Z" fill="#fde68a" stroke="#e6e6e6" />
              </motion.g>
            </g>

            {/* small motion lines */}
            <motion.g animate={{ opacity: [0.6, 0.2, 0.6] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <path d="M140 40 L150 36" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
              <path d="M140 48 L150 52" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          </svg>
          {/* caption below illustration (small, bold, colored) */}
          <div className="mt-2 text-xs font-semibold text-cc-primary dark:text-cc-primary text-center">Nice to meet you</div>
        </div>
      </div>
    </div>
  );
};

export default HandshakeIllustration;
