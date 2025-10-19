import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useChatSocket } from '../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com/api';

interface Conversation {
  id: number;
  conversation_type: string;
  title: string;
  created_at: string;
  other_participant?: {
    id: number;
    name: string;
    email: string;
    profile_picture_url: string;
    role: string;
  };
  last_message?: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count: number;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_picture: string;
  content: string;
  message_type: string;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, on, off, emit } = useChatSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      emit('join_conversation', selectedConversation.id);

      // Listen for new messages
      const handleNewMessage = (message: Message) => {
        if (message.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      };

      on('new_message', handleNewMessage);

      return () => {
        emit('leave_conversation', selectedConversation.id);
        off('new_message', handleNewMessage);
      };
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConversations(response.data.conversations || []);
    } catch (error: any) {
      console.error('Fetch conversations error:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/messages/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(response.data.messages || []);
    } catch (error: any) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/messages/conversations/${selectedConversation.id}/messages`,
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Message will be added via Socket.io event
      setNewMessage('');
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getCurrentUserId = () => {
    // Get from localStorage or auth store
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        <div className="bg-white rounded-full shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="grid grid-cols-12 h-full">
            {/* Conversations List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-200 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {conv.other_participant?.profile_picture_url ? (
                          <img
                            src={conv.other_participant.profile_picture_url}
                            alt={conv.other_participant.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <UserCircleIcon className="w-12 h-12 text-gray-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">
                              {conv.other_participant?.name || conv.title || 'Unknown'}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="ml-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.last_message
                              ? new Date(conv.last_message.created_at).toLocaleString()
                              : new Date(conv.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    {selectedConversation.other_participant?.profile_picture_url ? (
                      <img
                        src={selectedConversation.other_participant.profile_picture_url}
                        alt={selectedConversation.other_participant.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedConversation.other_participant?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isConnected ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-full px-4 py-2 ${
                                isOwn
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1 opacity-75">
                                  {msg.sender_name}
                                </p>
                              )}
                              <p>{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-purple-200' : 'text-gray-500'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sending ? 'Sending...' : 'Send'}
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
