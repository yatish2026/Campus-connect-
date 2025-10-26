import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const HeroDemo = () => {
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      while (mounted) {
        // step 1: type a post
        setStep(1);
        const message = 'Anyone up for a system design study session?';
        setText('');
        for (let i = 0; i <= message.length; i++) {
          if (!mounted) return;
          setText(message.slice(0, i));
          // typing speed
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 25));
        }
        // wait then post
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 700));
        setStep(2); // posted
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 900));

        // step 2: join club
        setStep(3);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 600));
        setStep(4); // joined
        // show success
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 900));

        // step 3: interview prep signup
        setStep(5);
        setText('Signing up for Interview Prep: Algorithms');
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1000));
        setStep(6); // signed up
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1000));

        // step 4: connect at college meet
        setStep(7);
        setText('Met Alex at the AI club meetup — connected!');
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 900));
        setStep(8); // connected
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1400));

        // reset
        setStep(0);
        setText('');
        // pause before repeat
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 800));
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4">
        {/* Post card */}
        <motion.div className="bg-cc-surface dark:bg-cc-darkblue rounded-xl shadow p-6 min-h-[84px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs text-slate-400 mb-2">Post</div>
          <div className="rounded-md border px-3 py-2 bg-slate-50 dark:bg-[#02202a] text-sm text-cc-accent dark:text-white min-h-[56px]">
            {step === 1 ? (
              <span className="inline-block">{text}<span className="blinking-cursor">|</span></span>
            ) : step === 2 ? (
              <span className="text-sm text-green-600">Posted ✅</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-300">Share an update with your campus</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">2 members online</div>
            <motion.button whileTap={{ scale: 0.95 }} className="px-3 py-1 rounded btn-cc-primary text-white text-sm">Post</motion.button>
          </div>
        </motion.div>

        {/* Club card */}
        <motion.div className="bg-cc-surface dark:bg-cc-darkblue rounded-xl shadow p-6 min-h-[72px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-cc-accent dark:text-white">AI Club — Machine Learning</div>
              <div className="text-xs text-slate-400">120 members</div>
            </div>
            <div>
              {step < 4 && (
                <motion.button whileTap={{ scale: 0.95 }} className="px-3 py-1 rounded bg-[#10b981] text-white text-sm">Join</motion.button>
              )}
              {step === 4 && (
                <div className="inline-flex items-center gap-2 text-sm text-green-500">Joined ✓</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Interview prep card */}
        <motion.div className="bg-cc-surface dark:bg-cc-darkblue rounded-xl shadow p-6 min-h-[64px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs text-slate-400 mb-2">Interview Prep</div>
          <div className="text-sm text-cc-accent dark:text-white">
            {step === 5 && <span>Signing up for Interview Prep: Algorithms<span className="blinking-cursor">|</span></span>}
            {step === 6 && <span className="text-green-600">Enrolled — Session starts soon ✅</span>}
            {step < 5 && <span className="text-slate-500 dark:text-slate-300">Practice interviews with peers and mentors</span>}
          </div>
        </motion.div>

        {/* Connect / College meet card */}
        <motion.div className="bg-cc-surface dark:bg-cc-darkblue rounded-xl shadow p-6 min-h-[84px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs text-slate-400 mb-2">College Meet</div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-cc-accent dark:text-white">
              {step === 7 && <span>Met Alex at AI meetup — sending connect request<span className="blinking-cursor">|</span></span>}
              {step === 8 && <span className="text-green-600">Connected — new contact added ✓</span>}
              {step < 7 && <span className="text-slate-500 dark:text-slate-300">Connect at events and grow your network</span>}
            </div>
            <div>
              {step < 8 ? (
                <motion.button whileTap={{ scale: 0.95 }} className="px-3 py-1 rounded btn-cc-primary text-white text-sm">Connect</motion.button>
              ) : (
                <div className="text-sm text-green-500">Connected</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`\n        .blinking-cursor{opacity:0.9;animation:blink 1s steps(2) infinite}\n        @keyframes blink{50%{opacity:0}}\n      `}</style>
    </div>
  );
};

export default HeroDemo;
