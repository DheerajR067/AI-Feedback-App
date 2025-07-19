"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { APIService, Message } from "../services/apiService";
import { VoiceService, VoiceState } from "../services/voiceService";

interface VoiceOrbProps {
  startParam?: string | null;
}

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
2. 'conversation' field: The ONLY text the user hears. Make it warm, empathetic, and engaging. Reference LEGOLAND attractions when relevant.
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

const VoiceOrb: React.FC<VoiceOrbProps> = ({ startParam }) => {
  const router = useRouter();
  const [voiceState, setVoiceState] = useState<VoiceState>("speaking");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [showStartButton, setShowStartButton] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lastUserReply, setLastUserReply] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([
    { role: "system", content: SYSTEM_PROMPT }
  ]);
  const [lastData, setLastData] = useState<any>(null);
  
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  // Initialize voice service
  useEffect(() => {
    voiceServiceRef.current = new VoiceService({
      onStateChange: (state: VoiceState) => {
        console.log("🎯 Voice Mode - State Changed:", state);
        setVoiceState(state);
      },
      onUserInput: handleUserInput,
      onError: (error) => {
        console.log("❌ Voice Service Error:", error);
      }
    });

    return () => {
      voiceServiceRef.current?.stop();
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      voiceServiceRef.current?.stop();
    };
  }, []);

  // Handle page visibility changes and navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      voiceServiceRef.current?.stop();
    };

    const handlePopState = () => {
      voiceServiceRef.current?.stop();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        voiceServiceRef.current?.stop();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (isActive) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isActive]);

  // Auto-start conversation (only once, after user activation)
  useEffect(() => {
    // Check for user activation via query param or localStorage
    let shouldStart = false;
    if (startParam === '1') shouldStart = true;
    if (typeof window !== 'undefined' && localStorage.getItem('voiceStart') === '1') shouldStart = true;
    if (shouldStart) {
      setIsActive(true);
      setShowStartButton(false);
      if (typeof window !== 'undefined') localStorage.removeItem('voiceStart');
    } else {
      setIsActive(false);
      setShowStartButton(true);
    }
  }, [startParam]);

  // Start conversation after activation
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log("🎬 Voice Mode - Starting Conversation:", {
        isActive: isActive,
        timestamp: new Date().toISOString()
      });
      startConversation();
    }
  }, [isActive]);

  // Handle user voice input
  const handleUserInput = async (transcript: string) => {
    console.log("🎤 Voice Mode - User Input:", transcript);
    setLastUserReply(transcript);
    
    const userMessage: Message = {
      role: "user",
      content: transcript
    };
    
    // Get the current conversation state to ensure we have the latest
    setConversation(currentConversation => {
      // Include the full conversation history (system + assistant + user) - same as ChatBox
      const newConversation = [...currentConversation, userMessage];
      
      // Debug: Log exactly what we're sending to API
      console.log("🎤 Voice Mode - Sending to API:", {
        conversationLength: newConversation.length,
        messages: newConversation.map((msg, idx) => `${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`),
        actualMessages: newConversation, // Log the actual Message objects
        timestamp: new Date().toISOString()
      });
      
      // Enter processing state and stop listening during API call
      voiceServiceRef.current?.enterProcessing();
      
      // Process the API call with the updated conversation
      processAPIResponse(newConversation, userMessage);
      
      return newConversation;
    });
  };

  // Process API response (extracted to avoid closure issues)
  const processAPIResponse = async (newConversation: Message[], userMessage: Message) => {
    try {
      // Get response using the same API service as ChatBox
      const response = await APIService.getAIResponse(newConversation);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.conversation + (response.parseWarning ? "\n[Warning: Response was not valid JSON. Displayed best effort.]" : ""),
        data: response.conversationData
      };
      
      // Update conversation with both user and assistant messages - same as ChatBox
      const updatedConversation = [...newConversation, assistantMessage];
      setConversation(updatedConversation);
      
      if (response.conversationData) {
        setLastData(response.conversationData);
        
        // Check if survey is complete
        if (response.conversationData.is_complete) {
          setIsComplete(true);
          console.log("🎉 Voice Mode - Survey Complete:", {
            conversationData: response.conversationData,
            timestamp: new Date().toISOString()
          });
          
          // Save feedback when survey is complete
          await saveFeedback(updatedConversation, response.conversationData);
          
          // Speak the final message and redirect
          voiceServiceRef.current?.speakText(response.conversation, () => {
            console.log("🗣️ Voice Mode - Final message speaking completed");
            setTimeout(() => {
              router.push("/");
            }, 2000);
          });
        } else {
          // Continue conversation - speak the response
          // The voice service will automatically switch to listening after speaking
          voiceServiceRef.current?.speakText(response.conversation, () => {
            console.log("🗣️ Voice Mode - Response speaking completed");
          });
        }
      }
    } catch (error) {
      console.log("💥 Voice Mode - API Error:", error);
      // On error, speak error message and continue listening
      voiceServiceRef.current?.speakText("I'm sorry, I encountered an error. Please try again.", () => {
        console.log("🗣️ Voice Mode - Error message speaking completed");
      });
    }
  };

  // Save feedback using the API service
  const saveFeedback = async (conv: Message[], conversationData: any) => {
    if (feedbackSaved) return; // Prevent duplicate saves
    
    try {
      await APIService.saveFeedback(conversationData?.data || {}, conv);
      setFeedbackSaved(true);
    } catch (error) {
      console.log("❌ Voice Mode - Feedback Save Error:", error);
    }
  };

  // Start the conversation with dynamic greeting
  const startConversation = async () => {
    console.log("🎤 Voice Mode - Starting Conversation");
    
    try {
      // Get the initial response (same as ChatBox) - send full conversation history
      const initialMessages: Message[] = [...conversation];
      
      // Debug: Log exactly what we're sending to API
      console.log("🎤 Voice Mode - Initial API Call:", {
        conversationLength: initialMessages.length,
        messages: initialMessages.map((msg, idx) => `${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`),
        actualMessages: initialMessages, // Log the actual Message objects
        timestamp: new Date().toISOString()
      });
      
      const response = await APIService.getAIResponse(initialMessages);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.conversation + (response.parseWarning ? "\n[Warning: Response was not valid JSON. Displayed best effort.]" : ""),
        data: response.conversationData
      };
      
      setConversation([{ role: "system", content: SYSTEM_PROMPT }, assistantMessage]);
      
      if (response.conversationData) {
        setLastData(response.conversationData);
      }
      
      // Speak the greeting
      voiceServiceRef.current?.speakText(response.conversation, () => {
        console.log("🗣️ Voice Mode - Initial greeting speaking completed");
      });
      
      // Start the voice service
      voiceServiceRef.current?.start();
    } catch (error) {
      console.log("💥 Voice Mode - Initial Call Error:", error);
      // Fallback greeting
      const fallbackGreeting = "Hi! Welcome to LEGOLAND Discovery Center Toronto! I'd love to hear about your experience today. How would you rate your overall visit on a scale of 1 to 10?";
      voiceServiceRef.current?.speakText(fallbackGreeting, () => {
        console.log("🗣️ Voice Mode - Fallback greeting speaking completed");
      });
      voiceServiceRef.current?.start();
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(!isMuted);
    voiceServiceRef.current?.toggleMute();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOrbColor = () => {
    switch (voiceState) {
      case "listening":
        return "#06b6d4"; // cyan-500
      case "processing":
        return "#f59e0b"; // amber-500
      case "speaking":
        return "#8b5cf6"; // violet-500
      default:
        return "#8b5cf6";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {showStartButton && (
        <button
          className="mb-8 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-white font-semibold text-xl shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => {
            setIsActive(true);
            setShowStartButton(false);
          }}
        >
          Start Voice Feedback
        </button>
      )}
      
      {/* Main Orb */}
      <div className="relative mb-12">
        <motion.div
          className="w-32 h-32 rounded-full relative"
          animate={{
            boxShadow: [
              `0 0 40px ${getOrbColor()}60`,
              `0 0 60px ${getOrbColor()}80`,
              `0 0 40px ${getOrbColor()}60`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Orb Background */}
          <div 
            className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${getOrbColor()}40, transparent 70%)`
            }}
          />
          
          {/* Orb Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {voiceState === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-white"
                >
                  <motion.div
                    className="w-8 h-8 border-2 border-white rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              )}
              
              {voiceState === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-white"
                >
                  <motion.div
                    className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              )}
              
              {voiceState === "speaking" && (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex space-x-1"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-white rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <motion.div 
          className="text-lg text-white/90 mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {voiceState === "listening" && "Listening..."}
          {voiceState === "processing" && "Processing..."}
          {voiceState === "speaking" && "Speaking..."}
        </motion.div>
        
        {isComplete && (
          <motion.div 
            className="text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {feedbackSaved ? "Thank you! Redirecting..." : "Saving feedback..."}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-6">
        {/* Duration */}
        <div className="text-center">
          <div className="text-xs text-white/60 mb-1">Duration</div>
          <div className="text-sm font-mono text-white">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition-all duration-200 ${
            isMuted 
              ? "bg-red-500/20 text-red-300" 
              : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            {isMuted ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            )}
          </svg>
        </button>
      </div>

      {/* Last User Reply */}
      {lastUserReply && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center max-w-md"
        >
          <div className="text-xs text-white/60 mb-2">You said</div>
          <div className="text-sm text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            &quot;{lastUserReply}&quot;
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceOrb; 