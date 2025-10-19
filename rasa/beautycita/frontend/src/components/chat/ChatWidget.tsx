import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/services/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  buttons?: Array<{
    title: string
    payload: string
  }>
}

export default function ChatWidget() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle background scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      const response = await apiClient.post('/chat/conversation')
      if (response.success && response.data) {
        // Handle the double-wrapped response structure
        const data = response.data.data || response.data
        setConversationId(data.conversationId)

        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          text: t('chat.welcome'),
          sender: 'bot',
          timestamp: new Date(),
          buttons: [
            { title: t('chat.buttons.services'), payload: 'servicios' },
            { title: t('chat.buttons.stylists'), payload: 'estilistas' },
            { title: t('chat.buttons.booking'), payload: 'reservar' }
          ]
        }
        setMessages([welcomeMessage])
      } else {
        throw new Error(response.error || 'Failed to initialize conversation')
      }
    } catch (error: any) {
      console.error('Error initializing conversation:', error)

      // Show error message to user
      const errorMessage: Message = {
        id: 'init-error',
        text: t('chat.errors.init'),
        sender: 'bot',
        timestamp: new Date(),
        buttons: [
          { title: t('chat.buttons.services'), payload: '/services' },
          { title: t('chat.buttons.stylists'), payload: '/stylists' },
          { title: t('chat.support'), payload: '/support' }
        ]
      }
      setMessages([errorMessage])
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversationId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/chat/message', {
        conversationId,
        message: text.trim()
      })

      if (response.success && response.data) {
        // Handle the double-wrapped response structure
        const data = response.data.data || response.data
        const { botResponses } = data

        botResponses.forEach((botResponse: any, index: number) => {
          setTimeout(() => {
            const botMessage: Message = {
              id: botResponse.id || `bot-${Date.now()}-${index}`,
              text: botResponse.text || t('chat.errors.general'),
              sender: 'bot',
              timestamp: new Date(),
              buttons: botResponse.buttons
            }
            setMessages(prev => [...prev, botMessage])
          }, index * 500) // Stagger bot responses
        })
      }
    } catch (error: any) {
      console.error('Error sending message:', error)

      let errorText = t('chat.errors.general')
      let buttons = undefined

      // Check for specific error types
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
        errorText = t('chat.errors.network')
      } else if (error.response?.status === 503) {
        errorText = t('chat.errors.unavailable')
        buttons = [
          { title: t('chat.retry'), payload: '/retry' },
          { title: t('chat.buttons.services'), payload: '/services' }
        ]
      } else if (error.response?.status >= 500) {
        errorText = t('chat.errors.server')
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        buttons
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = (payload: string, title: string) => {
    // Handle special actions
    if (payload === '/retry') {
      // Retry the last user message
      const lastUserMessage = messages.slice().reverse().find(m => m.sender === 'user')
      if (lastUserMessage) {
        sendMessage(lastUserMessage.text)
      }
      return
    }

    if (payload.startsWith('/')) {
      // Handle navigation actions
      switch (payload) {
        case '/services':
          window.location.href = '/services'
          return
        case '/stylists':
          window.location.href = '/stylists'
          return
        case '/support':
          window.location.href = '/contact'
          return
        default:
          break
      }
    }

    // Default: send the button title as a message
    sendMessage(title)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-rose-gold hover:shadow-rose-gold-glow text-white rounded-full shadow-beauty-soft flex items-center justify-center transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 500 }}
      >
        <div className="relative">
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          )}
          <div className="absolute inset-0 animate-pulse opacity-30">
            <SparklesIcon className="h-6 w-6" />
          </div>
        </div>
      </motion.button>

      {/* Background Blur Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.8, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-96 bg-white/90 backdrop-blur-xl rounded-3xl shadow-beauty-soft border border-white/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-cotton-candy text-white p-4 flex items-center justify-between relative">
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

              <div className="flex items-center space-x-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-rose-gold rounded-full flex items-center justify-center shadow-rose-gold-glow">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute inset-0 animate-glitter">
                    <SparklesIcon className="h-5 w-5 text-beauty-champagne opacity-50" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Aphrodite AI ✨</h3>
                  <p className="text-xs opacity-90">{t('chat.assistant')}</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-white hover:text-beauty-blush transition-colors duration-200 relative z-10 p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-beauty-blush/10 via-white to-beauty-lavender/10">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-tiktok text-white shadow-neon-pink'
                        : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-beauty-blush/20 shadow-beauty-soft'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>

                    {message.buttons && message.buttons.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.buttons.map((button, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleButtonClick(button.payload, button.title)}
                            className="block w-full text-left px-3 py-2 text-xs bg-gradient-to-r from-beauty-lavender/20 to-beauty-mint/20 hover:from-beauty-lavender/30 hover:to-beauty-mint/30 rounded-xl border border-beauty-lavender/30 transition-all duration-200 font-medium"
                          >
                            {button.title}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-60 mt-2 font-light">
                      {message.timestamp.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/80 backdrop-blur-sm text-gray-800 border border-beauty-blush/20 px-4 py-3 rounded-2xl shadow-beauty-soft">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-beauty-hot-pink rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-beauty-coral rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-beauty-lavender rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-beauty-blush/20">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 px-4 py-3 border border-beauty-blush/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beauty-hot-pink focus:border-beauty-hot-pink text-sm bg-white/80 backdrop-blur-sm"
                  disabled={isLoading}
                />
                <motion.button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 bg-gradient-rose-gold text-white rounded-2xl hover:shadow-rose-gold-glow focus:outline-none focus:ring-2 focus:ring-beauty-hot-pink disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}