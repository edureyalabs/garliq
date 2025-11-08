'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { TutorContext, TutorMessage } from '@/lib/tutor-context';

interface AITutorProps {
  context: TutorContext;
}

const MAX_MESSAGES = 100;

export default function AITutor({ context }: AITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    // Check message limit
    if (messages.length >= MAX_MESSAGES) {
      setError(`You've reached the ${MAX_MESSAGES} message limit. Please refresh to start a new session.`);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Add user message
    const newUserMessage: TutorMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call API
      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response
      const aiMessage: TutorMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('Tutor chat error:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      
      // Remove the user message if AI failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    setError(null);
  };

  return (
    <>
      {/* Floating AI Button - Clean Icon Only */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleOpen}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center group"
          >
            {/* Animated Gradient Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            
            {/* AI Icon */}
            <Bot size={24} className="relative z-10" strokeWidth={2} />
            
            {/* Pulse Animation */}
            <span className="absolute inset-0 rounded-full bg-purple-400 opacity-20 animate-[ping_1s_ease-in-out_60s_infinite]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - Slides from Bottom-Right */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Subtle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
            />

            {/* Chat Panel - 2025 Clean Design */}
            <motion.div
              initial={{ opacity: 0, x: 400, y: 400 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 400, y: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50"
              style={{ 
                width: '420px',
                maxWidth: '420px',
                height: '600px',
                maxHeight: 'calc(100vh - 100px)',
                borderRadius: '24px'
              }}
            >
              {/* Header - Gradient with Glass Effect */}
              <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-4 flex items-center justify-between flex-shrink-0">
                {/* Subtle Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base tracking-tight">AI Tutor</h3>
                    <p className="text-xs text-white/80 font-medium truncate max-w-[200px]">
                      {context.currentPageTitle}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={toggleOpen}
                  className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
                >
                  <X size={20} className="text-white" strokeWidth={2.5} />
                </button>
              </div>

              {/* Messages Area - Clean Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center py-8 max-w-[280px]">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                        <Bot size={32} className="text-purple-600" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        Hi! I'm your AI tutor 👋
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Ask me anything about <span className="font-semibold text-purple-600">{context.courseTitle}</span>
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600 font-medium">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2"
                  >
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Premium Design */}
              <div className="p-4 bg-white border-t border-gray-200/50 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask a question..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 resize-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                      disabled={loading || messages.length >= MAX_MESSAGES}
                      maxLength={2000}
                      rows={1}
                    />
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || loading || messages.length >= MAX_MESSAGES}
                    className="px-4 py-3 bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 flex-shrink-0 disabled:shadow-none"
                  >
                    <Send size={18} strokeWidth={2.5} />
                  </motion.button>
                </div>
                
                {messages.length >= MAX_MESSAGES && (
                  <p className="text-xs text-red-500 mt-2 text-center font-medium">
                    Message limit reached. Refresh to start new session.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}