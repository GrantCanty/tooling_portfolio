import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

const ChatInterface = ({ messages, setMessages, onToolCall, onMessageSent, hasStartedChat }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (onMessageSent) onMessageSent();
    setIsLoading(true);

    try {
      console.log(`sending message to ${import.meta.env.VITE_API_URL}`)
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8888'}/chat`, {
        message: input,
        history: messages.slice(-10) // Send last 10 messages for context
      });

      let content = response.data.content;
      if (!content && response.data.tool_calls && response.data.tool_calls.length > 0) {
        const tool = response.data.tool_calls[0];
        if (tool.name === 'navigate_to_view') {
          content = `Navigating to ${tool.arguments.view}...`;
        } else if (tool.name === 'compare_projects') {
          content = `Comparing projects...`;
        } else {
          content = `Action triggered.`;
        }
      }

      if (content) {
        const botMessage = { role: 'assistant', content: content };
        setMessages(prev => [...prev, botMessage]);
      }

      if (response.data.tool_calls && response.data.tool_calls.length > 0) {
        response.data.tool_calls.forEach(call => onToolCall(call));
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Is the backend running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-interface ${hasStartedChat ? 'full-height' : 'auto-height'}`}>
      {hasStartedChat && (
        <div className="messages-container">

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`message-wrapper ${msg.role}`}
            >
              <div className="avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="message-bubble">
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div className="message-wrapper assistant loading">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about Grant's projects..."
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          <Send size={18} />
        </button>
      </form>

      <style jsx>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .chat-interface.full-height {
          height: 100%;
        }

        .chat-interface.auto-height {
          height: auto;
        }


        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .message-wrapper {
          display: flex;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .message-wrapper.user {
          flex-direction: row-reverse;
        }


        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .user .avatar {
          background: var(--accent-blue);
          color: white;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .assistant .message-bubble {
          border-top-left-radius: 2px;
          background: var(--bg-chat-bot);
          border-color: rgba(66, 153, 225, 0.2);
        }

        .user .message-bubble {
          border-top-right-radius: 2px;
          background: var(--bg-chat-user);
        }

        .chat-input-area {
          padding: 20px;
          display: flex;
          gap: 10px;
          background: transparent;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        input {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 15px 24px;
          border-radius: 30px;
          color: white;
          outline: none;
          transition: border-color 0.2s;
          font-size: 16px;
        }

        input:focus {
          border-color: var(--accent-blue);
        }

        button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--accent-blue);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          flex-shrink: 0;
        }


        button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 10px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
