import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  MessageCircle,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const CareerCoach = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI Career Coach. I can help you with resume improvements, career guidance, job search strategies, and skill development recommendations. What would you like to discuss today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [resumeText] = useState(sessionStorage.getItem('resumeText') || '');
  const [jobDescription] = useState(sessionStorage.getItem('jobDescription') || '');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call the new career coach API
      const response = await axios.post(`${BACKEND_URL}/api/career-coach`, {
        resumeText,
        jobDescription,
        userMessage: inputMessage
      });

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.data.response || 'Sorry, I could not generate a response at this time.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I could not generate a response at this time.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickPrompts = [
    "How can I improve my resume?",
    "Help me prepare for interviews",
    "What skills should I develop?",
    "How do I negotiate salary?",
    "Career change advice"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Bot className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Career Coach</h1>
          <p className="text-lg text-gray-600">
            Get personalized career advice and guidance from your AI assistant
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div className={`flex-1 max-w-xs sm:max-w-md ${
                  message.type === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your career..."
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {isTyping ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <MessageCircle className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Responses</h3>
            <p className="text-gray-600 text-sm">Get immediate career advice and guidance</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Bot className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-gray-600 text-sm">Leveraging advanced AI for personalized advice</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <User className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized</h3>
            <p className="text-gray-600 text-sm">Tailored recommendations for your career goals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCoach;