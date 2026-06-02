import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { MessageSquare, X, Send, RefreshCw, ChevronDown } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const welcomeMessage = {
    id: 1,
    sender: 'bot',
    text: 'Hello 👋, how can I help you today?',
  };

  const quickQuestions = [
    'Where is my order?',
    'How can I cancel my order?',
    'How do I download my invoice?',
    'What payment methods are available?'
  ];

  // Initialize chat
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_history');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save to local storage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const clearChat = () => {
    setMessages([welcomeMessage]);
    localStorage.removeItem('chat_history');
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.get(`/faqs?search=${encodeURIComponent(text.trim())}`);
      
      let botText = "I'm sorry, I couldn't find an answer to that. Please try rephrasing or contact our support team.";
      
      if (data.success && data.data.length > 0) {
        // Find the best match (first one)
        botText = data.data[0].answer;
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the server right now.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-[100] transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'} bg-primary text-white hover:bg-opacity-90`}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-xl shadow-2xl z-[100] flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } border border-gray-200`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-xl flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center font-bold">
              R
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">RandomCart Support</h3>
              <p className="text-xs text-blue-100">Usually replies instantly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={clearChat} title="Clear Chat" className="p-1 hover:bg-white/20 rounded transition-colors">
              <RefreshCw size={18} />
            </button>
            <button onClick={toggleChat} title="Close" className="p-1 hover:bg-white/20 rounded transition-colors">
              <ChevronDown size={22} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-sm shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-bl-sm shadow-sm text-sm flex gap-1 items-center">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (only show if few messages or last is from bot) */}
        {messages.length < 5 && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap text-xs bg-white border border-primary text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-primary text-white p-2 rounded-full hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </>
  );
};

export default Chatbot;
