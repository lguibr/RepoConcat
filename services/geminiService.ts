import { GoogleGenAI, Chat } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private model = 'gemini-2.5-flash'; // High context window model ideal for large codebases

  constructor() {
    // API Key should be provided by environment or handled via backend in prod,
    // but for this specific instruction we assume process.env.API_KEY is available
    // OR we ask user for it if not. Since this is a client-side tool, 
    // we will rely on the user providing it in the UI if process.env.API_KEY is missing.
    const apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  updateApiKey(key: string) {
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async startChat(codebaseContext: string) {
    // Gemini 2.5 Flash has a ~1M token context window.
    // We will verify the length roughly. 1 char ~= 0.25 tokens (conservative).
    // If codebase is > 3-4MB characters, we might need to truncate or warn.
    
    const systemInstruction = `You are a helpful senior software engineer assisting a user with a codebase. 
    The user has provided the entire source code of a repository in a single Markdown format. 
    Use this context to answer questions about architecture, specific functions, bugs, or usage.
    
    -- BEGIN CODEBASE --
    ${codebaseContext.substring(0, 3000000)} 
    -- END CODEBASE --
    
    (Note: Context may be truncated if it exceeds limits).
    `;

    this.chatSession = this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemInstruction,
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized. Please load the repository first.");
    }
    
    try {
      const response = await this.chatSession.sendMessage({ message });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
