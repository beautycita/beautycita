import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com/api';

interface DisputeMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  is_admin_message: boolean;
  created_at: string;
}

interface Dispute {
  id: number;
  booking_id: number;
  title: string;
  description: string;
  dispute_type: string;
  status: string;
  requested_resolution: string;
  resolution_details: string;
  booking_date: string;
  service_name: string;
  created_at: string;
  messages: DisputeMessage[];
  evidence: any[];
}

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDisputeDetails();
    }
  }, [id]);

  const fetchDisputeDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/disputes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDispute(response.data.dispute);
    } catch (error: any) {
      console.error('Fetch dispute details error:', error);
      toast.error('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/disputes/${id}/messages`,
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Message sent');
      setMessage('');
      fetchDisputeDetails(); // Refresh to show new message
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispute not found</h2>
          <button
            onClick={() => navigate('/disputes')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to disputes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/disputes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to disputes
        </button>

        {/* Dispute Info */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {dispute.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Booking #{dispute.booking_id}</span>
                <span>•</span>
                <span>{dispute.service_name}</span>
                <span>•</span>
                <span>{new Date(dispute.booking_date).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              dispute.status === 'OPEN'
                ? 'bg-yellow-100 text-yellow-800'
                : dispute.status === 'RESOLVED'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {dispute.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-gray-700 mb-4">{dispute.description}</p>

          {dispute.requested_resolution && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Requested Resolution:
              </p>
              <p className="text-gray-700">
                {dispute.requested_resolution.replace('_', ' ')}
              </p>
            </div>
          )}

          {dispute.resolution_details && (
            <div className="mt-4 p-4 bg-green-50 rounded-3xl">
              <p className="text-sm font-medium text-green-900 mb-1">
                Resolution:
              </p>
              <p className="text-green-800">{dispute.resolution_details}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-white rounded-3xl shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Communication</h2>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {dispute.messages && dispute.messages.length > 0 ? (
              dispute.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${
                    msg.is_admin_message
                      ? 'bg-purple-50 border-l-4 border-purple-600 pl-4 py-3'
                      : 'bg-gray-50 p-4 rounded-full'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {msg.is_admin_message ? 'BeautyCita Support' : msg.sender_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-700">{msg.message}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No messages yet
              </p>
            )}
          </div>

          {/* Message Input */}
          {dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED' && (
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-3xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? 'Sending...' : 'Send'}
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Evidence */}
        {dispute.evidence && dispute.evidence.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Evidence</h2>
            <div className="space-y-3">
              {dispute.evidence.map((evidence) => (
                <div
                  key={evidence.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-3xl"
                >
                  <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{evidence.file_name}</p>
                    {evidence.description && (
                      <p className="text-sm text-gray-600">{evidence.description}</p>
                    )}
                  </div>
                  <a
                    href={evidence.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
