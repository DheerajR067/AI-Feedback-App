"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const LandingPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ background: 'linear-gradient(135deg, #1e3a8a, #7c3aed, #312e81)' }}
        animate={{
          background: [
            'linear-gradient(135deg, #1e3a8a, #7c3aed, #312e81)',
            'linear-gradient(135deg, #7c3aed, #312e81, #1e3a8a)',
            'linear-gradient(135deg, #312e81, #1e3a8a, #7c3aed)',
            'linear-gradient(135deg, #1e3a8a, #7c3aed, #312e81)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        style={{ backgroundSize: '400% 400%' }}
      />

      {/* Animated Orb Accent */}
      <motion.div
        className="absolute top-1/3 left-1/2 z-10"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{ x: '-50%', y: '-50%' }}
      >
        <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-purple-400 via-indigo-400 to-blue-400 blur-2xl opacity-60 shadow-2xl" />
      </motion.div>

      {/* Glassmorphism Card */}
      <motion.div
        className="relative z-20 flex flex-col items-center justify-center px-8 py-12 rounded-3xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg text-white text-center tracking-tight">
          LEGOLAND Discovery Center Toronto
        </h1>
        <p className="text-xl mb-10 opacity-90 text-white text-center max-w-xl">
          Share your family's experience and help us create even more amazing adventures
        </p>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.08, boxShadow: '0 0 24px #a5b4fc' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 text-white font-semibold text-lg shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            onClick={() => router.push('/chat')}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Start Chat
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.08, boxShadow: '0 0 24px #a5b4fc' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-white font-semibold text-lg shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('voiceStart', '1');
              }
              router.push('/voice?start=1');
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14S10 13.1 10 12V4C10 2.9 10.9 2 12 2ZM18 10C18 14.4 14.4 18 10 18V20C15.5 20 20 15.5 20 10H18ZM6 10C6 14.4 9.6 18 14 18V20C8.5 20 4 15.5 4 10H6Z" />
            </svg>
            Voice Mode
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage; 