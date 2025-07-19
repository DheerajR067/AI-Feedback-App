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
      // Log the request being sent to the API
      console.log("🚀 API Service - Sending request:", messages);
    

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      
      const data = await res.json();
      
      // Log the raw API response
      console.log("📡 API Service - Raw API Response:", {
        status: res.status,
        statusText: res.statusText,
        response: data.response,
        timestamp: new Date().toISOString()
      });
      
      // Try to parse as JSON for conversation/data split
      let conversation = data.response;
      let conversationData = null;
      let parseWarning = false;
      
      try {
        const parsed = JSON.parse(data.response);
        if (parsed.conversation) conversation = parsed.conversation;
        if (parsed.data) conversationData = parsed;
        
        // Log successful JSON parsing
        console.log("✅ API Service - JSON Parsing Success:", {
          parsed: parsed,
          conversation: conversation,
          conversationData: conversationData,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Log JSON parsing failure
        console.log("❌ API Service - JSON Parsing Failed:", {
          error: e,
          rawResponse: data.response,
          timestamp: new Date().toISOString()
        });
        
        // Regex fallback: extract largest JSON object from the response
        const match = data.response.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            if (parsed.conversation) conversation = parsed.conversation;
            if (parsed.data) conversationData = parsed;
            parseWarning = true;
            console.log("⚠️ API Service - Regex Fallback Success:", {
              extracted: match[0],
              parsed: parsed,
              timestamp: new Date().toISOString()
            });
          } catch (e2) {
            console.log("❌ API Service - Regex Fallback Failed:", {
              error: e2,
              extracted: match[0],
              timestamp: new Date().toISOString()
            });
            parseWarning = true;
          }
        } else {
          console.log("❌ API Service - No JSON Object Found:", {
            response: data.response,
            timestamp: new Date().toISOString()
          });
          parseWarning = true;
        }
      }
      
      // Log final processed data
      console.log("🎯 API Service - Final Processed Data:", {
        conversation: conversation,
        conversationData: conversationData,
        parseWarning: parseWarning,
        timestamp: new Date().toISOString()
      });
      
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

  // Save feedback to backend
  static async saveFeedback(answers: any, conversation: Message[]): Promise<void> {
    try {
      console.log("💾 API Service - Saving Feedback:", {
        answers: answers,
        conversationLength: conversation.length,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(`${BACKEND_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, conversation }),
      });
      
      if (response.ok) {
        console.log("✅ API Service - Feedback Saved Successfully:", {
          status: response.status,
          timestamp: new Date().toISOString()
        });
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