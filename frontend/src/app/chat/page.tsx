"use client";
import { useRouter } from "next/navigation";
import ChatBox from "../components/ChatBox";

export default function ChatPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white">
      <h2 className="text-3xl font-bold mb-4">LEGOLAND Discovery Center Toronto - Feedback</h2>
      <ChatBox />
      <div className="mt-8 flex gap-4">
        <button
          className="px-6 py-2 rounded bg-white text-indigo-900 font-semibold shadow hover:scale-105 transition-transform duration-200"
          onClick={() => router.push("/voice")}
        >
          Switch to Voice
        </button>
        <button
          className="px-6 py-2 rounded bg-white text-indigo-900 font-semibold shadow hover:scale-105 transition-transform duration-200"
          onClick={() => router.push("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
} 