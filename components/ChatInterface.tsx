import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  codebaseContent: string;
  repoName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ codebaseContent, repoName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt initialization if key exists
    if (apiKey && !isInitialized) {
      initializeChat();
    }
  }, [apiKey]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      geminiService.updateApiKey(apiKey);
      await geminiService.startChat(codebaseContent);
      setIsInitialized(true);
      setMessages([{
        role: 'model',
        text: `Hi! I've analyzed the **${repoName}** codebase. I'm ready to answer your questions about its architecture, functions, or specific files.`,
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
      // Don't set error state here, allow user to retry key input
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isInitialized || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await geminiService.sendMessage(userMsg.text);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message || 'Failed to generate response'}`, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isInitialized) {
    return (
      <div className="w-full max-w-4xl bg-gray-900 p-8 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Initialize AI Chat</h2>
        <p className="text-gray-400 max-w-md">
          To chat with this codebase, we need to initialize the Gemini model with the generated documentation context.
        </p>
        
        {!process.env.API_KEY && (
          <div className="w-full max-w-md space-y-2 text-left">
            <label className="text-sm font-medium text-gray-400">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google GenAI API Key"
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
             <p className="text-xs text-gray-500">
               Your key is used only locally for this session.
             </p>
          </div>
        )}

        <button
          onClick={initializeChat}
          disabled={loading || !apiKey}
          className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing Codebase...' : 'Start Chat Session'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-[600px] shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">Gemini Code Assistant</h3>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Context Loaded
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`flex-1 max-w-[80%] rounded-2xl p-4 
              ${msg.role === 'user' 
                ? 'bg-blue-600/10 border border-blue-600/20 text-blue-100' 
                : 'bg-gray-800 border border-gray-700 text-gray-200'}`}>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-purple-600/50 rounded-full" />
            <div className="bg-gray-800 rounded-2xl p-4 h-12 w-32" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the codebase..."
            className="w-full bg-gray-950 border border-gray-800 text-white pl-4 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
