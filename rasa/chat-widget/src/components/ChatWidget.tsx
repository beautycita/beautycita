import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Minimize2 } from 'lucide-react';
import './ChatWidget.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: Array<{
    title: string;
    payload: string;
  }>;
}

interface ChatWidgetProps {
  rasaEndpoint?: string;
  initialMessage?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  rasaEndpoint = 'http://localhost:5005',
  initialMessage = '¡Hola! Soy el asistente de BeautyCita. ¿Cómo puedo ayudarte hoy?',
  theme = 'light',
  position = 'bottom-right',
  primaryColor = '#8B5CF6'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial bot message
      const welcomeMessage: Message = {
        id: 'welcome',
        text: initialMessage,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text: string, payload?: string) => {
    if (!text.trim() && !payload) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: text || payload || '',
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${rasaEndpoint}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: sessionId,
          message: payload || text
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const botResponses = await response.json();

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);

        if (botResponses && botResponses.length > 0) {
          const botMessages: Message[] = botResponses.map((resp: any, index: number) => ({
            id: `bot_${Date.now()}_${index}`,
            text: resp.text || '',
            sender: 'bot' as const,
            timestamp: new Date(),
            buttons: resp.buttons || undefined
          }));

          setMessages(prev => [...prev, ...botMessages]);
        } else {
          // Fallback message if no response
          const fallbackMessage: Message = {
            id: `bot_${Date.now()}`,
            text: 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?',
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }, 800);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'Hubo un problema conectando con el asistente. Por favor intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleButtonClick = (payload: string, title: string) => {
    sendMessage(title, payload);
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`chat-widget ${positionClasses[position]}`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`chat-window ${theme} ${isMinimized ? 'minimized' : ''}`}
          style={{ '--primary-color': primaryColor } as React.CSSProperties}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="header-info">
              <div className="avatar">
                <MessageCircle size={20} />
              </div>
              <div className="header-text">
                <h3>Asistente BeautyCita</h3>
                <span className="status">En línea</span>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={minimizeWidget} className="minimize-btn">
                <Minimize2 size={16} />
              </button>
              <button onClick={toggleWidget} className="close-btn">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
            <>
              <div className="messages-container">
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.sender}`}>
                    <div className="message-content">
                      <p>{message.text}</p>
                      {message.buttons && (
                        <div className="message-buttons">
                          {message.buttons.map((button, index) => (
                            <button
                              key={index}
                              className="message-button"
                              onClick={() => handleButtonClick(button.payload, button.title)}
                            >
                              {button.title}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="message bot">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="input-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="message-input"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!inputText.trim() || isTyping}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleWidget}
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ChatWidget;