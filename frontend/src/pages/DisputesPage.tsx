import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com/api';

interface Dispute {
  id: number;
  booking_id: number;
  dispute_type: string;
  status: string;
  title: string;
  description: string;
  created_at: string;
  booking_date: string;
  service_name: string;
  stylist_name?: string;
  initiator_name: string;
  respondent_name: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = filter !== 'ALL' ? { status: filter } : {};

      const response = await axios.get(`${API_URL}/disputes`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setDisputes(response.data.disputes || []);
    } catch (error: any) {
      console.error('Fetch disputes error:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'UNDER_REVIEW':
        return <ClockIcon className="h-5 w-5" />;
      case 'RESOLVED':
      case 'REFUNDED':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'CLOSED':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Disputes</h1>
          <p className="mt-2 text-gray-600">
            Manage and track your dispute cases
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No disputes found
            </h3>
            <p className="text-gray-600">
              {filter === 'ALL'
                ? "You don't have any disputes"
                : `No ${filter.toLowerCase().replace('_', ' ')} disputes`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Link
                key={dispute.id}
                to={`/disputes/${dispute.id}`}
                className="block bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusIcon(dispute.status)}
                          {dispute.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          Booking #{dispute.booking_id}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {dispute.title}
                      </h3>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {dispute.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Service: {dispute.service_name || 'N/A'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(dispute.booking_date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Created {new Date(dispute.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
