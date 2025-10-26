import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from 'react-i18next'

interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface AphroditeChatProps {
  isOpen: boolean
  onClose: () => void
  conversationType?: string
}

export default function AphroditeChat({ isOpen, onClose, conversationType = 'general' }: AphroditeChatProps) {
  const { isAuthenticated } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'

      loadConversation()
      inputRef.current?.focus()

      // Cleanup: unlock scroll when modal closes
      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      const response = await axios.get(`/api/aphrodite/conversation/${sessionId}`)
      if (response.data.success && response.data.data.messages) {
        setMessages(response.data.data.messages)
      } else {
        // Random humorous welcome message from goddess Aphrodite
        const welcomeGreetings = t('chat.welcome', { returnObjects: true }) as string[]
        const randomGreeting = Array.isArray(welcomeGreetings)
          ? welcomeGreetings[Math.floor(Math.random() * welcomeGreetings.length)]
          : welcomeGreetings

        setMessages([{
          role: 'assistant',
          content: randomGreeting
        }])
      }
    } catch (error) {
      console.error('Error loading conversation:', error)

      // Random humorous welcome message from goddess Aphrodite
      const welcomeGreetings = t('chat.welcome', { returnObjects: true }) as string[]
      const randomGreeting = Array.isArray(welcomeGreetings)
        ? welcomeGreetings[Math.floor(Math.random() * welcomeGreetings.length)]
        : welcomeGreetings

      setMessages([{
        role: 'assistant',
        content: randomGreeting
      }])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await axios.post('/api/aphrodite/chat', {
        language: i18n.language || 'en',
        message: userMessage,
        sessionId,
        conversationType
      })

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.data.message
        }])
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chat.errors.general')
      }])
    } finally {
      setIsLoading(false)
      // Keep focus on input after sending message
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const suggestedQuestions = [
    t('chat.suggestedQuestions.q1'),
    t('chat.suggestedQuestions.q2'),
    t('chat.suggestedQuestions.q3'),
    t('chat.suggestedQuestions.q4')
  ]

  const handleSuggestionClick = (question: string) => {
    setInputMessage(question)
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop - Full screen overlay to close on click */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Mobile: Centered Modal */}
      <div
        className="lg:hidden fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[65vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-6 h-6 text-pink-600" />
              <h2 className="text-lg font-bold text-gray-900">Aphrodite AI</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-3xl">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 1 && messages[0].role === 'assistant' && (
              <div className="grid grid-cols-1 gap-2 mb-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-left p-3 bg-purple-50 text-sm text-gray-900 font-medium hover:bg-purple-100 transition-colors border border-purple-200 rounded-3xl"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-3xl ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-medium text-pink-600">Aphrodite</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-3xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-pink-600 rounded-3xl animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-3xl animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-3xl animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{t('chat.typing')}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-3xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop: Aphrodite Visual - positioned above Aphrodite on bottom right, last message at mouth level */}
      <div className="hidden lg:block fixed bottom-[14rem] right-6 sm:right-12 lg:right-24 max-w-sm w-[90%] sm:w-96 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
          {messages.length === 1 && messages[0].role === 'assistant' && (
            <div className="grid grid-cols-1 gap-2 mb-3 pointer-events-auto">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-left p-3 bg-white/20 backdrop-blur-md text-sm text-gray-900 font-medium hover:bg-purple-500/20 transition-colors border border-gray-300/30 hover:border-purple-400/50"
                  style={{ borderRadius: '0.75rem', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' }}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => {
            const isLatestAssistant = message.role === 'assistant' && index === messages.length - 1
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 backdrop-blur-md ${
                    message.role === 'user'
                      ? 'bg-purple-600/20 text-gray-900 border border-purple-300/30'
                      : isLatestAssistant
                      ? 'bg-white/40 text-gray-900 border-2 border-gray-400/40 relative'
                      : 'bg-white/30 text-gray-900 border border-gray-300/30 relative'
                  }`}
                  style={{
                    borderRadius: message.role === 'user' ? '1rem' : isLatestAssistant ? '2rem' : '1rem',
                    boxShadow: message.role === 'user'
                      ? '0 10px 40px rgba(168, 85, 247, 0.15)'
                      : isLatestAssistant
                      ? '0 15px 50px rgba(0, 0, 0, 0.15)'
                      : '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {isLatestAssistant && (
                    <>
                      {/* Comic-style speech bubble tail on bottom left pointing to Aphrodite's face */}
                      <div className="absolute -bottom-3 left-4 w-6 h-6 bg-white/40 border-2 border-gray-400/40 transform rotate-45 rounded-sm" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' }}></div>
                    </>
                  )}
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-medium text-pink-600">Aphrodite</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                </div>
              </motion.div>
            )
          })}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div
                className="bg-white/30 backdrop-blur-md px-4 py-3 border border-gray-300/30"
                style={{ borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-pink-600 rounded-3xl animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-3xl animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-3xl animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{t('chat.typing')}</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Desktop Input Field - Bottom right */}
      <div className="hidden lg:block fixed bottom-6 right-6 sm:right-12 lg:right-24 w-[90%] sm:w-96 max-w-sm pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSendMessage} className="relative">
          <div
            className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-transparent p-1"
            style={{ borderRadius: '0.5rem', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none focus:ring-0 border-none text-sm text-gray-900 placeholder-gray-600"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-3xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Floating Aphrodite Button Component
export function AphroditeFloatingButton({ onClick, isOpen }: { onClick: () => void, isOpen?: boolean }) {
  return (
    <>
      {/* Desktop Only: Aphrodite Image - completely hidden on mobile */}
      <div className="hidden lg:block">
        <motion.button
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: 1,
            width: isOpen ? '16rem' : '8rem',
            height: isOpen ? '16rem' : '8rem',
            x: isOpen ? -450 : 0,
            y: isOpen ? 50 : 0
          }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1.0]
          }}
          whileHover={{ scale: isOpen ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`fixed bottom-8 right-24 flex items-center justify-center group ${isOpen ? 'z-40' : 'z-[9999]'}`}
        >
          <img loading="lazy"
            src="/aphroditeSm.png"
            alt="Aphrodite AI"
            className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,105,180,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(255,105,180,0.8)]"
          />

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-3xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Pregúntale a Aphrodite
              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </motion.button>
      </div>

      {/* Mobile Only: Icon Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="lg:hidden fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-3xl shadow-lg flex items-center justify-center group"
      >
        <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-3xl"></div>
      </motion.button>
    </>
  )
}