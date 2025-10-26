import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useChatSocket } from '../hooks/useSocket'
import { PageHero } from '../components/ui'

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com/api'

interface Conversation {
  id: number
  conversation_type: string
  title: string
  created_at: string
  other_participant?: {
    id: number
    name: string
    email: string
    profile_picture_url: string
    role: string
  }
  last_message?: {
    id: number
    content: string
    created_at: string
    sender_id: number
  }
  unread_count: number
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  sender_name: string
  sender_picture: string
  content: string
  message_type: string
  created_at: string
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isConnected, on, off, emit } = useChatSocket()

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      emit('join_conversation', selectedConversation.id)

      const handleNewMessage = (message: Message) => {
        if (message.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, message])
          scrollToBottom()
        }
      }

      on('new_message', handleNewMessage)

      return () => {
        emit('leave_conversation', selectedConversation.id)
        off('new_message', handleNewMessage)
      }
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setConversations(response.data.conversations || [])
    } catch (error: any) {
      console.error('Fetch conversations error:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        `${API_URL}/messages/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMessages(response.data.messages || [])
    } catch (error: any) {
      console.error('Fetch messages error:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation) {
      return
    }

    setSending(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(
        `${API_URL}/messages/conversations/${selectedConversation.id}/messages`,
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setNewMessage('')
    } catch (error: any) {
      console.error('Send message error:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getCurrentUserId = () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.id
      } catch (e) {
        return null
      }
    }
    return null
  }

  const currentUserId = getCurrentUserId()

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-16 h-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Messages"
        subtitle="Connect with stylists and manage your conversations"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-72"
        icon={ChatBubbleLeftRightIcon}
      />

      <div className="container mx-auto px-4 max-w-7xl -mt-16 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
        >
          <div className="grid grid-cols-12 h-full">
            {/* Conversations List */}
            <div className={`col-span-12 md:col-span-4 overflow-y-auto ${
              isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'
            }`}>
              {conversations.length === 0 ? (
                <div className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                      <ChatBubbleLeftRightIcon className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    No Conversations Yet
                  </h3>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Start a conversation with a stylist to get started
                  </p>
                </div>
              ) : (
                <div className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                  {conversations.map((conv, index) => (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left transition-all ${
                        selectedConversation?.id === conv.id
                          ? `${isDarkMode ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' : 'bg-gradient-to-r from-pink-50 to-purple-50'}`
                          : `${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {conv.other_participant?.profile_picture_url ? (
                          <img
                            loading="lazy"
                            src={conv.other_participant.profile_picture_url}
                            alt={conv.other_participant.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                            <UserCircleIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {conv.other_participant?.name || conv.title || 'Unknown'}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="ml-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className={`text-sm truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {conv.last_message
                              ? new Date(conv.last_message.created_at).toLocaleString()
                              : new Date(conv.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className={`p-4 flex items-center gap-3 ${
                    isDarkMode ? 'border-b border-gray-700 bg-gray-800/50' : 'border-b border-gray-200 bg-white'
                  }`}>
                    {selectedConversation.other_participant?.profile_picture_url ? (
                      <img
                        loading="lazy"
                        src={selectedConversation.other_participant.profile_picture_url}
                        alt={selectedConversation.other_participant.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedConversation.other_participant?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {isConnected ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <SparklesIcon className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUserId
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md`}>
                              <div
                                className={`rounded-3xl px-5 py-3 ${
                                  isOwn
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                                    : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`
                                }`}
                              >
                                {!isOwn && (
                                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'opacity-75'}`}>
                                    {msg.sender_name}
                                  </p>
                                )}
                                <p className="break-words">{msg.content}</p>
                                <p
                                  className={`text-xs mt-1.5 ${
                                    isOwn ? 'text-pink-100' : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
                                  }`}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className={`p-4 ${
                    isDarkMode ? 'border-t border-gray-700 bg-gray-800/50' : 'border-t border-gray-200 bg-white'
                  }`}>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className={`flex-1 px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-pink-500/50 ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        {sending ? 'Sending...' : 'Send'}
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Select a Conversation
                    </h3>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Choose a conversation from the left to start messaging
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
