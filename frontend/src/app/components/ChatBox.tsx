"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { APIService, Message } from "../services/apiService";

const FEEDBACK_QUESTIONS = [
  "How would you rate your overall experience at LEGOLAND Discovery Center Toronto?",
  "Which attraction or activity did you enjoy the most?",
  "What could we improve to make your visit even better?",
  "Would you recommend LEGOLAND Discovery Center Toronto to friends and family? Why or why not?",
  "Any additional comments about your visit or suggestions for future improvements?",
];
const SYSTEM_PROMPT = `You are an empathetic, intelligent feedback interviewer for LEGOLAND Discovery Center Toronto. Your ONLY job is to ask questions and respond in VALID JSON format.

CRITICAL: Your ENTIRE response must be a SINGLE valid JSON object. NO text before or after the JSON. If you add any text outside the JSON, it will break the app.

Questions to cover (in order):
1. How would you rate your overall experience at LEGOLAND Discovery Center Toronto? (1-10 scale)
2. Which attraction or activity did you enjoy the most?
3. What could we improve to make your visit even better?
4. Would you recommend LEGOLAND Discovery Center Toronto to friends and family? Why or why not?
5. Any additional comments about your visit or suggestions for future improvements?

For each main question:
- Ask the main question conversationally in the 'conversation' field.
- If the user's answer is short, unclear, or could benefit from more insight, ask up to 2 follow-up questions to gather deeper feedback. Otherwise, move to the next main question.
- Summarize insights from follow-ups in the 'remark' field for that question.
- Only ask follow-ups if they will provide more useful information.
- Reference specific LEGOLAND attractions like MINILAND, LEGO Factory Tour, Kingdom Quest, etc. when relevant.

RESPONSE FORMAT - RESPOND WITH ONLY THIS JSON STRUCTURE:
{
  "conversation": "Your conversational question or response to the user (natural, friendly, and human-like)",
  "data": {
    "Q1": {"answer": "user's answer to Q1 (empty string if not answered)", "remark": "your insight from follow-ups for Q1 (empty if no follow-ups done)"},
    "Q2": {"answer": "user's answer to Q2 (empty string if not answered)", "remark": "your insight from follow-ups for Q2 (empty if no follow-ups done)"},
    "Q3": {"answer": "user's answer to Q3 (empty string if not answered)", "remark": "your insight from follow-ups for Q3 (empty if no follow-ups done)"},
    "Q4": {"answer": "user's answer to Q4 (empty string if not answered)", "remark": "your insight from follow-ups for Q4 (empty if no follow-ups done)"},
    "Q5": {"answer": "user's answer to Q5 (empty string if not answered)", "remark": "your insight from follow-ups for Q5 (empty if no follow-ups done)"}
  },
  "current_question": "Q1",
  "is_complete": false
}

STRICT RULES:
1. RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT. If you add any text before or after the JSON, the app will break.
2. 'conversation' field: The ONLY text the user sees in chat. Make it warm, empathetic, and engaging. Reference LEGOLAND attractions when relevant.
3. 'data' field: For backend processing only (user never sees this)
4. 'answer' field: Store user's direct response to the main question
5. 'remark' field: Store your insights after follow-up questions
6. 'current_question': Track which question you're on (Q1, Q2, Q3, Q4, Q5)
7. 'is_complete': Set to true ONLY after you have thanked the user for their feedback. Do NOT require the user to type 'done'.

EXAMPLES OF GOOD RESPONSES (ONLY JSON, NO TEXT OUTSIDE):
{"conversation": "Hi! Welcome to LEGOLAND Discovery Center Toronto! I'd love to hear about your experience today. How would you rate your overall visit on a scale of 1 to 10?", "data": {"Q1": {"answer": "", "remark": ""}, "Q2": {"answer": "", "remark": ""}, "Q3": {"answer": "", "remark": ""}, "Q4": {"answer": "", "remark": ""}, "Q5": {"answer": "", "remark": ""}}, "current_question": "Q1", "is_complete": false}
{"conversation": "Thank you so much for visiting LEGOLAND Discovery Center Toronto and sharing your valuable feedback! Your insights help us create even better experiences for families. We hope to see you again soon!", "data": {"Q1": {"answer": "8", "remark": "User enjoyed the overall experience but mentioned some areas for improvement."}, "Q2": {"answer": "MINILAND was amazing!", "remark": "User was particularly impressed with the detailed Toronto cityscape in MINILAND."}, "Q3": {"answer": "More seating areas would be helpful.", "remark": "User suggested adding more rest areas for families."}, "Q4": {"answer": "Yes, because it's perfect for families.", "remark": "User would recommend due to family-friendly atmosphere."}, "Q5": {"answer": "Great experience overall!", "remark": "User had a positive overall impression."}}, "current_question": "Q5", "is_complete": true}

EXAMPLES OF BAD RESPONSES (DO NOT DO THIS!):
Let's move on to something else. Which attraction did you enjoy the most? {JSON here}
It can be tough to put your finger on it sometimes. Let's move on to something else. Which attraction did you enjoy the most? {JSON here}
Thank you for your feedback! {JSON here}

REMEMBER: ONLY THE JSON OBJECT - NO CONVERSATIONAL TEXT OUTSIDE THE JSON! ALWAYS END WITH A THANK YOU WHEN THE SURVEY IS COMPLETE.`;

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastData, setLastData] = useState<any>(null); // store last conversation data for backend
  const [streamingAssistant, setStreamingAssistant] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initialAICalled = useRef(false); // Prevent duplicate initial conversation call

  // Start the initial AI message using streaming
  const startInitialAI = async () => {
    setLoading(true);
    setStreamingAssistant(true);
    // Add a placeholder assistant message for streaming (but don't show raw JSON)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    let streamedContent = "";
    try {
      streamedContent = await APIService.streamAIResponse(
        [{ role: "system", content: SYSTEM_PROMPT }],
        (chunk) => {
          // Do not update the message content with raw JSON while streaming
        }
      );
      // After streaming, parse the full message for JSON and update state
      let conversation = streamedContent;
      let conversationData = null;
      let parseWarning = false;
      try {
        const parsed = JSON.parse(streamedContent);
        if (parsed.conversation) conversation = parsed.conversation;
        if (parsed.data) conversationData = parsed;
      } catch (e) {
        const match = streamedContent.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            if (parsed.conversation) conversation = parsed.conversation;
            if (parsed.data) conversationData = parsed;
            parseWarning = true;
          } catch (e2) {
            parseWarning = true;
          }
        } else {
          parseWarning = true;
        }
      }
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: conversation + (parseWarning ? "\n[Warning: Response was not valid JSON. Displayed best effort.]" : ""),
            data: conversationData,
          };
        }
        return updated;
      });
      if (conversationData) setLastData(conversationData);
    } catch (err) {
      console.error("❌ Error getting response (initial AI):", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[Error connecting to backend]" },
      ]);
    }
    setStreamingAssistant(false);
    setLoading(false);
  };

  // On mount, start the conversation
  useEffect(() => {
    // Only trigger if there are no assistant messages yet
    const hasAssistant = messages.some(m => m.role === "assistant");
    if (messages.length === 1 && !hasAssistant && !initialAICalled.current) {
      initialAICalled.current = true;
      console.log("🎬 Chat Mode - Initial Conversation Call Triggered:", {
        messagesLength: messages.length,
        hasAssistant: hasAssistant,
        timestamp: new Date().toISOString()
      });
      startInitialAI();
    }
    // eslint-disable-next-line
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect progress from lastData
  useEffect(() => {
    if (lastData && lastData.data) {
      let answered = 0;
      for (let i = 1; i <= FEEDBACK_QUESTIONS.length; i++) {
        const q = `Q${i}`;
        if (lastData.data[q] && lastData.data[q].answer && lastData.data[q].answer.trim() !== "") {
          answered++;
        }
      }
      setProgress(answered);
    } else {
      setProgress(0);
    }
  }, [lastData]);

  // Auto-redirect to landing page when survey is complete
  useEffect(() => {
    if (lastData && lastData.is_complete && !feedbackSaved) {
      console.log("🎉 Chat Mode - Survey Complete, Saving Feedback:", {
        lastData: lastData,
        timestamp: new Date().toISOString()
      });
      
      // Save feedback when survey is complete
      saveFeedback(messages, lastData);
      
      // Redirect after a delay to show the thank you message
      setTimeout(() => {
        router.push("/");
      }, 2000); // 2 second delay for user to see the thank you message
    }
  }, [lastData, router, feedbackSaved, messages]);

  // Send user message and get response (streaming)
  const sendMessage = async () => {
    if (!input.trim() || loading || feedbackSaved) return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingAssistant(true);
    // Add a placeholder assistant message for streaming (but don't show raw JSON)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    let streamedContent = "";
    try {
      streamedContent = await APIService.streamAIResponse(newMessages, (chunk) => {
        // Do not update the message content with raw JSON while streaming
      });
      // After streaming, parse the full message for JSON and update state
      let conversation = streamedContent;
      let conversationData = null;
      let parseWarning = false;
      try {
        const parsed = JSON.parse(streamedContent);
        if (parsed.conversation) conversation = parsed.conversation;
        if (parsed.data) conversationData = parsed;
      } catch (e) {
        // Regex fallback: extract largest JSON object from the response
        const match = streamedContent.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            if (parsed.conversation) conversation = parsed.conversation;
            if (parsed.data) conversationData = parsed;
            parseWarning = true;
          } catch (e2) {
            parseWarning = true;
          }
        } else {
          parseWarning = true;
        }
      }
      setMessages((prev) => {
        // Update the last assistant message with the parsed/cleaned content
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: conversation + (parseWarning ? "\n[Warning: Response was not valid JSON. Displayed best effort.]" : ""),
            data: conversationData,
          };
        }
        return updated;
      });
      if (conversationData) setLastData(conversationData);
    } catch (err) {
      console.error("❌ Error getting response:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[Error connecting to backend]" },
      ]);
    }
    setStreamingAssistant(false);
    setLoading(false);
  };

  // Save feedback using the API service
  const saveFeedback = async (conv: Message[], conversationData: any) => {
    try {
      await APIService.saveFeedback(conversationData?.data || {}, conv);
      setFeedbackSaved(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Thank you for your feedback! Session saved." },
      ]);
    } catch (err) {
      console.error("❌ Error saving feedback:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[Error saving feedback]" },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col h-[70vh] bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 relative">
      {/* Progress bar in top right */}
      <div className="absolute top-4 right-6 bg-indigo-900/80 text-white text-xs px-4 py-1 rounded-full shadow">
        {progress}/{FEEDBACK_QUESTIONS.length} answered
      </div>
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.slice(1).map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[70%] text-base whitespace-pre-line shadow
                ${msg.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-white/80 text-indigo-900 border border-indigo-200"}
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {/* Show 'Assistant is typing...' bubble if streaming */}
        {streamingAssistant && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl max-w-[70%] text-base shadow bg-white/80 text-indigo-900 border border-indigo-200 italic opacity-80">
              Assistant is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
        {feedbackSaved && (
          <div className="text-center text-green-400 font-semibold mt-8">Feedback saved! Thank you.</div>
        )}
      </div>
      {!feedbackSaved && (
        <div className="flex gap-2 mt-auto">
          <input
            className="flex-1 px-4 py-2 rounded-full bg-white/80 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 text-white font-semibold shadow hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox; 