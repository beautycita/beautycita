import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, Circle, Phone, MapPin, Heart, Camera,
  User, Mail, ChevronRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionItem {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  action?: string;
  actionLabel?: string;
}

interface ProfileCompletionData {
  completionPercentage: number;
  items: ProfileCompletionItem[];
  totalItems: number;
  completedItems: number;
}

interface ProfileCompletionProgressProps {
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

const ProfileCompletionProgress: React.FC<ProfileCompletionProgressProps> = ({
  compact = false,
  showActions = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileCompletionData>({
    completionPercentage: 0,
    items: [],
    totalItems: 0,
    completedItems: 0
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchProfileCompletion();
  }, []);

  const fetchProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile-completion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Map backend data to UI structure
        const items: ProfileCompletionItem[] = [
          {
            id: 'email_verified',
            label: 'Verify Email',
            completed: result.email_verified || false,
            icon: <Mail className="w-5 h-5" />,
            action: '/verify-email',
            actionLabel: 'Verify Now'
          },
          {
            id: 'phone_verified',
            label: 'Verify Phone',
            completed: result.phone_verified || false,
            icon: <Phone className="w-5 h-5" />,
            action: '/verify-phone',
            actionLabel: 'Verify Now'
          },
          {
            id: 'location_set',
            label: 'Set Location',
            completed: result.location_set || false,
            icon: <MapPin className="w-5 h-5" />,
            action: '/settings',
            actionLabel: 'Add Location'
          },
          {
            id: 'profile_picture',
            label: 'Add Profile Picture',
            completed: result.profile_picture || false,
            icon: <Camera className="w-5 h-5" />,
            action: '/profile/edit',
            actionLabel: 'Upload Photo'
          },
          {
            id: 'bio_complete',
            label: 'Complete Bio',
            completed: result.bio_complete || false,
            icon: <User className="w-5 h-5" />,
            action: '/profile/edit',
            actionLabel: 'Add Bio'
          },
          {
            id: 'preferences_set',
            label: 'Set Preferences',
            completed: result.preferences_set || false,
            icon: <Heart className="w-5 h-5" />,
            action: '/settings',
            actionLabel: 'Set Preferences'
          }
        ];

        const completedCount = items.filter(item => item.completed).length;
        const percentage = Math.round((completedCount / items.length) * 100);

        setData({
          completionPercentage: percentage,
          items,
          totalItems: items.length,
          completedItems: completedCount
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action?: string) => {
    if (action) {
      navigate(action);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  // Don't show if profile is 100% complete
  if (data.completionPercentage === 100) {
    return null;
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - data.completionPercentage / 100)}`}
                  className="text-pink-500 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{data.completionPercentage}%</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Complete Your Profile</h4>
              <p className="text-xs text-gray-400">
                {data.completedItems} of {data.totalItems} completed
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
          >
            View Tasks
          </button>
        </div>

        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-pink-500/30"
          >
            <div className="space-y-2">
              {data.items.filter(item => !item.completed).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400">{item.icon}</div>
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  {showActions && item.action && (
                    <button
                      onClick={() => handleActionClick(item.action)}
                      className="text-xs text-pink-400 hover:text-pink-300 font-medium"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Profile Completion</h3>
            <p className="text-sm text-gray-400">
              {data.completionPercentage === 100
                ? 'Your profile is complete!'
                : `${data.completedItems} of ${data.totalItems} tasks completed`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {data.completionPercentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-600 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${data.completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {data.items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              item.completed
                ? 'bg-green-600/10 border-green-500/30'
                : 'bg-gray-900/50 border-gray-700 hover:border-pink-500/30'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={item.completed ? 'text-green-400' : 'text-gray-500'}>
                {item.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <div className={item.completed ? 'text-gray-400' : 'text-gray-300'}>
                {item.icon}
              </div>
              <div>
                <p className={`font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {item.label}
                </p>
              </div>
            </div>
            {!item.completed && showActions && item.action && (
              <button
                onClick={() => handleActionClick(item.action)}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                <span>{item.actionLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {item.completed && (
              <div className="text-sm font-medium text-green-400">
                ✓ Complete
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion Message */}
      {data.completionPercentage === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <h4 className="text-white font-semibold">Profile Complete! 🎉</h4>
              <p className="text-sm text-gray-300">
                Your profile is fully set up and ready to attract clients or find stylists.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfileCompletionProgress;
