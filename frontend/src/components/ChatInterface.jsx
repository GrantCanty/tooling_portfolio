import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = ({ messages, setMessages, onToolCall, onMessageSent, hasStartedChat }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevInputRef = useRef(input);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const placeholders = [
    "Tell me about your work experience",
    "Compare 2 projects you've built",
    "Where did you go to school?",
    "Can I see your resume?",
    "What is your favorite stack?",
    "What are some of your hobbies?",
    "Where are you from?",
    "What languages do you speak?"
  ];

  // Handle resets when input changes (especially when cleared)
  useEffect(() => {
    if (input) {
      setPlaceholderText('');
      setIsDeleting(false);
    } else if (prevInputRef.current && !input) {
      // Just became empty
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }
    prevInputRef.current = input;
  }, [input, placeholders.length]);

  useEffect(() => {
    if (input) return;

    const currentFullText = placeholders[placeholderIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        if (placeholderText.length < currentFullText.length) {
          setPlaceholderText(currentFullText.slice(0, placeholderText.length + 1));
        } else {
          setIsDeleting(true);
        }
      } else {
        if (placeholderText.length > 0) {
          setPlaceholderText(currentFullText.slice(0, placeholderText.length - 1));
        } else {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }
    };

    // Calculate delay: use 3000ms if we just finished typing, otherwise use standard typing speed
    const typingSpeed = 23;
    const pauseDuration = 1200;
    const delay = (!isDeleting && placeholderText.length === currentFullText.length)
      ? pauseDuration
      : typingSpeed;

    const timeout = setTimeout(handleTyping, delay);
    return () => clearTimeout(timeout);
  }, [input, placeholderText, isDeleting, placeholderIndex, placeholders]);

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

      if (content) {
        const botMessage = { role: 'assistant', content: content };
        setMessages(prev => [...prev, botMessage]);
      }

      if (response.data.tool_calls && response.data.tool_calls.length > 0) {
        response.data.tool_calls.forEach(call => {
          onToolCall(call);

          // Generate a friendly confirmation message if the LLM didn't provide one
          if (!content) {
            let confirmMsg = "Processing action...";
            if (call.name === 'navigate_to_view') {
              const viewName = call.arguments?.view || 'view';
              confirmMsg = `*Navigating to the **${viewName}** view...*`;
            } else if (call.name === 'compare_projects') {
              confirmMsg = `*Opening project comparison...*`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }]);
          }
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Is the backend running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
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
                <div className="message-bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
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
        <div className="input-container">
          <div className="placeholder-wrapper" style={{ opacity: input ? 0 : 1, pointerEvents: 'none' }}>
            <div className="animated-placeholder">
              {placeholderText}
            </div>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
          />
          <AnimatePresence>
            {input.trim() && (
              <motion.button
                key="submit-button"
                initial={{ opacity: 0, scale: 0.8, x: 5 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 5 }}
                type="submit"
                className="submit-button"
                disabled={isLoading}
                onMouseDown={(e) => e.preventDefault()}
              >
                <ArrowUp size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <style jsx>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          background: transparent;
          height: 100%;
          width: 100%;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
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


        .message-bubble {
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          width: 100%;
        }

        .assistant .message-bubble {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 12px 0;
        }

        .user .message-bubble {
          border-radius: 12px;
          background: var(--bg-chat-user);
          border: 1px solid var(--border-color);
          max-width: max-content;
        }

        .chat-input-area {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
          background: transparent;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 6px 6px 6px 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .input-container:focus-within {
          border-color: var(--accent-blue);
          box-shadow: 0 4px 24px rgba(66, 153, 225, 0.15);
          background: rgba(255, 255, 255, 0.05);
        }

        textarea {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 0;
          color: white;
          outline: none;
          font-size: 15px;
          font-family: inherit;
          position: relative;
          z-index: 2;
          resize: none;
          max-height: 200px;
          overflow-y: auto;
          line-height: 1.5;
        }

        .placeholder-wrapper {
          position: absolute;
          left: 20px;
          top: 0;
          bottom: 0;
          right: 60px;
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .animated-placeholder {
          color: var(--text-secondary);
          font-size: 15px;
          white-space: nowrap;
          user-select: none;
          opacity: 0.6;
          display: flex;
          align-items: center;
        }

        .submit-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-blue);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #53acee;
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
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
