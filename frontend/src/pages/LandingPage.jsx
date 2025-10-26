import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import HandshakeIllustration from "../components/HandshakeIllustration";

const features = [
  {
    title: "Create your profile",
    desc: "Showcase projects, skills and achievements to your campus community.",
    icon: "🧑‍🎓",
  },
  {
    title: "Join Campus Clubs",
    desc: "Find and join clubs, events and study groups that match your interests.",
    icon: "🤝",
  },
  {
    title: "Share your thoughts",
    desc: "Post updates, ask questions and share resources with classmates.",
    icon: "✍️",
  },
  {
    title: "Grow your network",
    desc: "Connect with peers, mentors and alumni across campuses.",
    icon: "📈",
  },
];

const testimonials = [
  {
    name: "Priya, CS Student",
    quote: "I found a study group and landed a project role through Campus Connect.",
  },
  {
    name: "James, Senior",
    quote: "Great place to practice interviews and get honest feedback.",
  },
];

const LandingPage = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    document.title = 'Campus Connect — Connect. Collaborate. Grow.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Campus Connect is a professional network built for students and campuses. Connect with peers, join clubs, and prepare for interviews.');
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Campus Connect is a professional network built for students and campuses. Connect with peers, join clubs, and prepare for interviews.';
      document.head.appendChild(m);
    }
  }, []);

  // Apply saved theme (light/dark) at mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_theme');
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const toggleTheme = () => {
    try {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('cc_theme', isDark ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-cc-bg text-cc">
      <header className="py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/campus-connect-logo.svg" alt="Campus Connect" className="h-10 w-10" />
            <span className="font-bold text-xl">Campus Connect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-cc-accent dark:text-white">
            <a href="#home" className="hover:underline">Home</a>
            <a href="#features" className="hover:underline">Features</a>
            <a href="#about" className="hover:underline">About</a>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="rounded-lg px-3 py-2 text-white bg-cc-primary">Sign Up</Link>
            <button onClick={toggleTheme} title="Toggle theme" className="ml-2 p-2 rounded-md bg-white dark:bg-slate-800 border">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cc-accent dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-11h-1M4.34 12h-1M18.36 18.36l-.7-.7M6.34 6.34l-.7-.7M18.36 5.64l-.7.7M6.34 17.66l-.7.7M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Hero */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12">
          <div>
            <motion.h1 className="text-4xl sm:text-5xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Linking every mind on our
              svcet campus
            </motion.h1>

            <motion.p className="mt-4 text-lg text-cc-accent max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Our all-in-one hub to connect, collaborate, grow and create memories.
            </motion.p>

            <motion.div className="mt-8 flex gap-4 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button to="/signup" className="shadow transform-gpu hover:scale-[1.02]" variant="primary">Join Now</Button>
              <Link to="/login" className="inline-flex items-center px-4 py-2 rounded-lg border text-cc-accent">Login</Link>
            </motion.div>

            <motion.div className="mt-8 text-sm text-slate-500 dark:text-slate-300" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Your digital space to meet, share, and shine.
            </motion.div>
          </div>

          <div className="lg:order-last">
            <motion.div className="w-full h-auto bg-cc-surface dark:bg-cc-darkblue rounded-2xl shadow-md p-6"
              initial={{ scale: 0.98, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-full">
                <HandshakeIllustration />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-12">
          <motion.h2 className="text-2xl font-semibold" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Built for students by student
          </motion.h2>

          <motion.div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {features.map((f, i) => (
              <motion.div key={f.title} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -6 }}>
                <Card variant={i % 3 === 0 ? 'softBlue' : i % 3 === 1 ? 'softGreen' : 'softRose'}>
                  <div className="text-3xl">{f.icon}</div>
                  <div className="mt-3 font-semibold text-cc-accent dark:text-white">{f.title}</div>
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">{f.desc}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Testimonials removed as requested */}

        {/* CTA */}
        <section className="py-12">
          <div className="bg-cc-primary dark:bg-cc-darkblue text-white rounded-2xl p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Get started on Campus Connect</div>
              <div className="text-sm text-white opacity-90 mt-1">Join clubs, post updates and prepare for interviews with your peers.</div>
            </div>
            <div>
              <Button to="/signup" className="bg-white text-cc-primary font-semibold">Create free account</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 dark:text-slate-300">
          <div>© {new Date().getFullYear()} Campus Connect</div>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <a href="#about" className="hover:underline">About</a>
            <a href="mailto:hello@campusconnect.example" className="hover:underline">Contact</a>
            <a href="https://github.com/yatish2026" target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.76-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.526.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.005 2.045.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.65.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.805 5.62-5.476 5.92.43.37.814 1.096.814 2.21 0 1.595-.015 2.877-.015 3.268 0 .32.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/yatish-gottapu/" target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666h-3.554V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.602 0 4.268 2.369 4.268 5.455v6.288zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 010 4.124zM6.985 20.452H3.688V9h3.297v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.728v20.543C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.728C24 .774 23.2 0 22.225 0z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            <a href="https://yatish2026.github.io/profile/" target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" />
                <path d="M2 12h20" stroke="currentColor" />
                <path d="M12 2v20" stroke="currentColor" />
              </svg>
              <span>Portfolio</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {showTop && (
        <button onClick={scrollToTop} aria-label="Scroll to top" className="fixed right-6 bottom-6 bg-white rounded-full p-3 shadow-lg">
          ↑
        </button>
      )}
    </div>
  );
};

export default LandingPage;
