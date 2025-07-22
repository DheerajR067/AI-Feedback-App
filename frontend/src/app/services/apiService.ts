// Reusable API service for both chat and voice modes
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  data?: any; // for storing structured data from conversation
}

export interface ConversationResponse {
  conversation: string;
  conversationData: any;
  parseWarning: boolean;
}

const BACKEND_URL = "http://localhost:8000";

export class APIService {
  // Get response from backend
  static async getAIResponse(messages: Message[]): Promise<ConversationResponse> {
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      
      const data = await res.json();
      
      let conversation = data.response;
      let conversationData = null;
      let parseWarning = false;
      
      try {
        const parsed = JSON.parse(data.response);
        if (parsed.conversation) conversation = parsed.conversation;
        if (parsed.data) conversationData = parsed;
        
      } catch (e) {
        
        const match = data.response.match(/\{[\s\S]*\}/);
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
      
      return {
        conversation,
        conversationData: conversationData,
        parseWarning
      };
    } catch (err) {
      console.log("💥 API Service - Network/API Error:", {
        error: err,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }

  // Stream response from backend
  static async streamAIResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.body) throw new Error("No response body from backend");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullText = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        fullText += chunk;
        onChunk(chunk);
      }
    }
    return fullText;
  }

  // Get response from backend for voice mode (non-streaming)
  static async getVoiceAIResponse(messages: Message[]): Promise<ConversationResponse> {
    try {
      const res = await fetch(`${BACKEND_URL}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      const data = await res.json();
      let conversation = data.response;
      let conversationData = null;
      let parseWarning = false;
      try {
        const parsed = JSON.parse(data.response);
        if (parsed.conversation) conversation = parsed.conversation;
        if (parsed.data) conversationData = parsed;
      } catch (e) {
        
        const match = data.response && typeof data.response === 'string' ? data.response.match(/\{[\s\S]*\}/) : null;
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
      return {
        conversation,
        conversationData: conversationData,
        parseWarning
      };
    } catch (err) {
      console.log("💥 API Service - VOICE Network/API Error:", {
        error: err,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }

  // Save feedback to backend
  static async saveFeedback(answers: any, conversation: Message[]): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, conversation }),
      });
      
      if (response.ok) {
      } else {
        console.log("❌ API Service - Feedback Save Failed:", {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to save feedback: ${response.status}`);
      }
    } catch (error) {
      console.log("❌ API Service - Feedback Save Error:", {
        error: error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
} 