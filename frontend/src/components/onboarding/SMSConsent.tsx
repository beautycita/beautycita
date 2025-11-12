import React, { useState } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';

export interface SMSPreferences {
  booking_requests: boolean;
  booking_confirmations: boolean;
  proximity_alerts: boolean;
  payment_notifications: boolean;
  reminders: boolean;
  cancellations: boolean;
  marketing: boolean;
}

interface SMSConsentProps {
  onSave: (preferences: SMSPreferences) => void | Promise<void>;
  onSkip?: () => void;
  initialPreferences?: Partial<SMSPreferences>;
}

const defaultPreferences: SMSPreferences = {
  booking_requests: true,
  booking_confirmations: true,
  proximity_alerts: true,
  payment_notifications: true,
  reminders: true,
  cancellations: true,
  marketing: false,
};

const notificationOptions = [
  {
    key: 'booking_requests' as keyof SMSPreferences,
    title: 'Booking Requests',
    description: 'Get notified when clients request appointments',
    recommended: true,
    category: 'essential',
  },
  {
    key: 'booking_confirmations' as keyof SMSPreferences,
    title: 'Booking Confirmations',
    description: 'Receive confirmation when bookings are confirmed or modified',
    recommended: true,
    category: 'essential',
  },
  {
    key: 'proximity_alerts' as keyof SMSPreferences,
    title: 'Proximity Alerts',
    description: 'Know when clients are on their way (10 min, 5 min, arrived)',
    recommended: true,
    category: 'essential',
  },
  {
    key: 'payment_notifications' as keyof SMSPreferences,
    title: 'Payment Notifications',
    description: 'Get notified when payments are received',
    recommended: true,
    category: 'essential',
  },
  {
    key: 'reminders' as keyof SMSPreferences,
    title: 'Appointment Reminders',
    description: 'Receive reminders 24 hours before appointments',
    recommended: true,
    category: 'helpful',
  },
  {
    key: 'cancellations' as keyof SMSPreferences,
    title: 'Cancellation Alerts',
    description: 'Get notified immediately when appointments are cancelled',
    recommended: true,
    category: 'helpful',
  },
  {
    key: 'marketing' as keyof SMSPreferences,
    title: 'Marketing & Promotions',
    description: 'Receive promotional offers and platform updates (optional)',
    recommended: false,
    category: 'optional',
  },
];

/**
 * SMS notification consent component
 *
 * Features:
 * - Individual opt-in for each notification type
 * - Recommended settings highlighted
 * - Grouped by category (essential, helpful, optional)
 * - Saves to backend API
 *
 * @example
 * <SMSConsent
 *   onSave={(prefs) => console.log('Saved:', prefs)}
 *   onSkip={() => console.log('Skipped')}
 * />
 */
export const SMSConsent: React.FC<SMSConsentProps> = ({
  onSave,
  onSkip,
  initialPreferences,
}) => {
  const [preferences, setPreferences] = useState<SMSPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (key: keyof SMSPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.fromEntries(
      Object.keys(preferences).map(key => [key, true])
    ) as SMSPreferences;
    setPreferences(allSelected);
  };

  const handleSelectRecommended = () => {
    const recommended = notificationOptions.reduce((acc, option) => {
      acc[option.key] = option.recommended;
      return acc;
    }, {} as SMSPreferences);
    setPreferences(recommended);
  };

  const handleSelectNone = () => {
    const noneSelected = Object.fromEntries(
      Object.keys(preferences).map(key => [key, false])
    ) as SMSPreferences;
    setPreferences(noneSelected);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Save to backend
      const response = await apiClient.post('/sms-preferences', preferences);

      if (response.success) {
        toast.success('Notification preferences saved');
        await onSave(preferences);
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = Object.keys(preferences).length;

  // Group options by category
  const essentialOptions = notificationOptions.filter(opt => opt.category === 'essential');
  const helpfulOptions = notificationOptions.filter(opt => opt.category === 'helpful');
  const optionalOptions = notificationOptions.filter(opt => opt.category === 'optional');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <BellIcon className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          SMS Notification Preferences
        </h3>
        <p className="text-gray-600">
          Choose which notifications you'd like to receive via SMS
        </p>
        <div className="mt-2 text-sm text-gray-500">
          {enabledCount} of {totalCount} enabled
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button
          onClick={handleSelectRecommended}
          className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
        >
          Select Recommended
        </button>
        <button
          onClick={handleSelectAll}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={handleSelectNone}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Select None
        </button>
      </div>

      {/* Notification Options */}
      <div className="space-y-6">
        {/* Essential Notifications */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Essential Notifications
          </h4>
          <div className="space-y-2">
            {essentialOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-start gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-purple-300 transition-all"
              >
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={() => handleToggle(option.key)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {option.title}
                    </span>
                    {option.recommended && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Helpful Notifications */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Helpful Notifications
          </h4>
          <div className="space-y-2">
            {helpfulOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-start gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-purple-300 transition-all"
              >
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={() => handleToggle(option.key)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {option.title}
                    </span>
                    {option.recommended && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Optional Notifications */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Optional
          </h4>
          <div className="space-y-2">
            {optionalOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-start gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-purple-300 transition-all"
              >
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={() => handleToggle(option.key)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {option.title}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Standard SMS rates may apply. You can update these preferences anytime in your account settings. We respect your privacy and will never share your phone number with third parties.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="flex-1 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
};

export default SMSConsent;
