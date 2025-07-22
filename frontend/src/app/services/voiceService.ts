// Reusable voice service for speech recognition and synthesis
export type VoiceState = "speaking" | "listening" | "processing";

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface VoiceServiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onUserInput: (transcript: string) => void;
  onError: (error: any) => void;
}

export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesisUtterance | null = null;
  private callbacks: VoiceServiceCallbacks;
  private currentState: VoiceState = "speaking"; // Start in speaking state, not listening
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 10;
  private autoRestartTimeout: NodeJS.Timeout | null = null;

  constructor(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
    this.initializeRecognition();
  }

  private setState(newState: VoiceState) {
    console.log(`🔄 Voice Service - State Change: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    this.callbacks.onStateChange(newState);
  }

  private initializeRecognition() {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Enhanced recognition settings for better quality
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // Enable interim results for better responsiveness
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
      this.recognition.serviceURI = ""; // Use default service for best performance

      this.recognition.onstart = () => {
        console.log("🎤 Voice Service - Recognition Started (Enhanced)");
        this.restartAttempts = 0;
        if (this.currentState === "listening") {
          this.callbacks.onStateChange("listening");
        }
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        // Process all results for better accuracy
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Log interim results for debugging
        if (interimTranscript.trim()) {
          console.log("🎤 Voice Service - Interim Result:", interimTranscript.trim());
        }

        // Process final results
        if (finalTranscript.trim()) {
          console.log("🎤 Voice Service - Final Result:", finalTranscript.trim());
          
          // Only process input if we're in listening state and not speaking
          if (this.currentState === "listening" && !this.isSpeaking) {
            this.setState("processing");
            this.callbacks.onUserInput(finalTranscript.trim());
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.log("❌ Voice Service - Recognition Error:", event.error);
        
        // Handle specific error types
        switch (event.error) {
          case 'no-speech':
            console.log("🎤 Voice Service - No speech detected, continuing to listen...");
            // Don't restart for no-speech, just continue listening
            return;
          case 'audio-capture':
            console.log("🎤 Voice Service - Audio capture error, restarting...");
            break;
          case 'not-allowed':
            console.log("🎤 Voice Service - Microphone permission denied");
            this.callbacks.onError("Microphone permission denied. Please allow microphone access.");
            return;
          case 'aborted':
            console.log("🎤 Voice Service - Recognition aborted");
            return;
          default:
            console.log("🎤 Voice Service - Unknown error, attempting restart...");
        }
        
        // Only restart if we're active, not muted, and not speaking
        if (this.isActive && !this.isMuted && !this.isSpeaking && event.error !== 'aborted') {
          this.restartAttempts += 1;
          if (this.restartAttempts > this.maxRestartAttempts) {
            console.log("❌ Voice Service - Max restart attempts reached");
            this.callbacks.onError("Voice recognition failed. Please refresh the page.");
            return;
          }
          this.restartRecognition();
        }
      };

      this.recognition.onend = () => {
        console.log("🛑 Voice Service - Recognition Ended");
        
        // Only restart if we're active, not muted, in listening state, and not speaking
        if (this.isActive && !this.isMuted && this.currentState === "listening" && !this.isSpeaking) {
          this.restartAttempts += 1;
          if (this.restartAttempts > this.maxRestartAttempts) {
            console.log("❌ Voice Service - Max restart attempts reached");
            return;
          }
          
          // Quick restart for continuous mode
          this.autoRestartTimeout = setTimeout(() => {
            this.restartRecognition();
          }, 100);
        }
      };

      // Add audio level monitoring for better debugging
      this.recognition.onaudiostart = () => {
        console.log("🎤 Voice Service - Audio capture started");
      };

      this.recognition.onaudioend = () => {
        console.log("🎤 Voice Service - Audio capture ended");
      };

      this.recognition.onsoundstart = () => {
        console.log("🎤 Voice Service - Sound detected");
      };

      this.recognition.onsoundend = () => {
        console.log("🎤 Voice Service - Sound ended");
      };

      this.recognition.onspeechstart = () => {
        console.log("🎤 Voice Service - Speech started");
      };

      this.recognition.onspeechend = () => {
        console.log("🎤 Voice Service - Speech ended");
      };
    }
  }

  private restartRecognition() {
    if (this.isActive && !this.isMuted && this.currentState === "listening" && !this.isSpeaking && this.recognition) {
      try {
        console.log("🔄 Voice Service - Restarting Recognition");
        this.recognition.start();
      } catch (error) {
        console.log("❌ Voice Service - Failed to restart recognition:", error);
      }
    }
  }

  // Start the voice service
  start() {
    this.isActive = true;
    this.isSpeaking = false;
    this.restartAttempts = 0;
    console.log("🎬 Voice Service - Starting");
    // Don't change state here - let the calling code set the initial state
  }

  // Stop the voice service
  stop() {
    this.isActive = false;
    this.isSpeaking = false;
    console.log("🛑 Voice Service - Stopping");
    
    // Stop speech synthesis
    this.stopSpeech();
    
    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.log("❌ Voice Service - Error stopping recognition:", error);
      }
    }
    
    // Clear all timeouts
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }
  }

  // Start listening for voice input
  startListening() {
    if (this.isActive && !this.isMuted && this.currentState === "listening" && !this.isSpeaking && this.recognition) {
      try {
        console.log("🎤 Voice Service - Starting Listening");
        this.recognition.start();
      } catch (error) {
        console.log("❌ Voice Service - Failed to start listening:", error);
      }
    }
  }

  // Stop listening for voice input
  stopListening() {
    if (this.recognition) {
      try {
        console.log("🛑 Voice Service - Stopping Listening");
        this.recognition.stop();
      } catch (error) {
        console.log("❌ Voice Service - Error stopping listening:", error);
      }
    }
  }

  // Enter processing state (stop listening during API call)
  enterProcessing() {
    console.log("🔄 Voice Service - Entering Processing State");
    this.setState("processing");
    // Stop listening during processing
    this.stopListening();
  }

  // Stop current speech
  private stopSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.synthesis) {
      this.synthesis = null;
    }
    this.isSpeaking = false;
  }

  // Toggle mute state
  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log("🔇 Voice Service - Mute:", this.isMuted);
    
    if (this.isMuted) {
      this.stopListening();
      // Do NOT stop speech synthesis when muting
      // this.stopSpeech();
      if (this.autoRestartTimeout) {
        clearTimeout(this.autoRestartTimeout);
        this.autoRestartTimeout = null;
      }
    } else {
      this.restartAttempts = 0;
      if (this.isActive && this.currentState === "listening" && !this.isSpeaking) {
        setTimeout(() => {
          this.startListening();
        }, 300);
      }
    }
  }

  // Speak text using speech synthesis (callback-based, no Promise)
  speakText(text: string, onComplete?: () => void) {
    if ("speechSynthesis" in window) {
      console.log("🗣️ Voice Service - Speaking:", text);
      this.isSpeaking = true; // Set speaking flag
      this.setState("speaking");
      
      // Stop listening while speaking
      this.stopListening();
      
      // Add a short 'thinking' delay before speaking
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Enhanced speech synthesis settings for better quality
        utterance.rate = 0.85; // Slightly slower for better clarity
        utterance.pitch = 1.1; // Slightly higher pitch for more natural sound
        utterance.volume = 1.0; // Full volume
        utterance.lang = "en-US"; // Ensure English language
        
        // Try to use a better voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang === "en-US" && 
          (voice.name.includes("Google") || voice.name.includes("Natural") || voice.name.includes("Premium"))
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log("🗣️ Voice Service - Using voice:", preferredVoice.name);
        } else {
          console.log("🗣️ Voice Service - Using default voice");
        }
        
        utterance.onstart = () => {
          console.log("🗣️ Voice Service - Speech Started");
          this.isSpeaking = true;
        };
        
        utterance.onend = () => {
          console.log("🗣️ Voice Service - Speech Ended");
          this.isSpeaking = false; // Clear speaking flag
          
          // Switch back to listening mode
          this.setState("listening");
          
          // Start listening after speech is done
          setTimeout(() => {
            this.startListening();
          }, 100);
          
          // Call the completion callback
          if (onComplete) {
            onComplete();
          }
        };
        
        utterance.onerror = (error) => {
          console.log("❌ Voice Service - Speech Error:", error);
          this.isSpeaking = false; // Clear speaking flag
          
          // Switch back to listening mode even on error
          this.setState("listening");
          
          // Start listening after speech error
          setTimeout(() => {
            this.startListening();
          }, 100);
        };
        
        this.synthesis = utterance;
        window.speechSynthesis.speak(utterance);
      }, 200);
    } else {
      console.log("❌ Voice Service - Speech synthesis not supported");
    }
  }

  // Get current state
  getState() {
    return {
      currentState: this.currentState,
      isActive: this.isActive,
      isMuted: this.isMuted,
      isSpeaking: this.isSpeaking,
      restartAttempts: this.restartAttempts
    };
  }
} 