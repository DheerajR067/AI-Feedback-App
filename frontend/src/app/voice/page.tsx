"use client";
import { useRouter, useSearchParams } from "next/navigation";
import VoiceOrb from "../components/VoiceOrb";
import { motion } from "framer-motion";

export default function VoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startParam = searchParams.get('start');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
        onClick={() => router.push("/")}
      >
        ← Back to Home
      </motion.button>
      
      <VoiceOrb startParam={startParam} />
    </div>
  );
} 