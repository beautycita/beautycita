import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, Trash2, Cookie, AlertTriangle, CheckCircle, Lock, Eye, Mail, MessageSquare, Search, BarChart } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PrivacyPreferences {
  marketing_emails: boolean;
  promotional_emails: boolean;
  booking_reminders: boolean;
  sms_notifications: boolean;
  share_data_with_stylists: boolean;
  show_profile_in_search: boolean;
  analytics_tracking: boolean;
}

const PrivacySettings: React.FC = () => {
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    marketing_emails: true,
    promotional_emails: true,
    booking_reminders: true,
    sms_notifications: true,
    share_data_with_stylists: true,
    show_profile_in_search: true,
    analytics_tracking: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/privacy-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setPreferences(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<PrivacyPreferences>) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updatedPrefs = { ...preferences, ...newPreferences };

      const response = await fetch('/api/users/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPrefs)
      });

      if (response.ok) {
        setPreferences(updatedPrefs);
        toast.success('Privacy settings updated');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/export-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beautycita-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Your data has been exported successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmation: deleteConfirmText })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Account deletion scheduled for ${new Date(data.scheduled_deletion_date).toLocaleDateString()}. You have ${data.grace_period_days} days to cancel.`,
          { duration: 10000 }
        );
        setShowDeleteDialog(false);

        // Log user out after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }, 3000);
      } else {
        toast.error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  const togglePreference = (key: keyof PrivacyPreferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-8 h-8 text-pink-500" />
        <div>
          <h3 className="text-2xl font-bold text-white">Privacy & Data</h3>
          <p className="text-gray-400 text-sm">Manage your privacy settings and personal data</p>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="w-5 h-5 text-purple-400" />
          <h4 className="text-lg font-semibold text-white">Email Preferences</h4>
        </div>
        <div className="space-y-4">
          <ToggleSwitch
            label="Marketing Emails"
            description="Receive promotional emails about new features and offers"
            checked={preferences.marketing_emails}
            onChange={() => togglePreference('marketing_emails')}
            disabled={saving}
          />
          <ToggleSwitch
            label="Promotional Emails"
            description="Get notified about special deals and discounts"
            checked={preferences.promotional_emails}
            onChange={() => togglePreference('promotional_emails')}
            disabled={saving}
          />
          <ToggleSwitch
            label="Booking Reminders"
            description="Receive reminders about upcoming appointments"
            checked={preferences.booking_reminders}
            onChange={() => togglePreference('booking_reminders')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-semibold text-white">Communication Preferences</h4>
        </div>
        <div className="space-y-4">
          <ToggleSwitch
            label="SMS Notifications"
            description="Receive text messages for important booking updates"
            checked={preferences.sms_notifications}
            onChange={() => togglePreference('sms_notifications')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Privacy Preferences */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="w-5 h-5 text-green-400" />
          <h4 className="text-lg font-semibold text-white">Profile Visibility</h4>
        </div>
        <div className="space-y-4">
          <ToggleSwitch
            label="Share Data with Stylists"
            description="Allow stylists to see your booking history and preferences"
            checked={preferences.share_data_with_stylists}
            onChange={() => togglePreference('share_data_with_stylists')}
            disabled={saving}
          />
          <ToggleSwitch
            label="Show Profile in Search"
            description="Make your profile visible in stylist searches (if you're a stylist)"
            checked={preferences.show_profile_in_search}
            onChange={() => togglePreference('show_profile_in_search')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Analytics */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart className="w-5 h-5 text-yellow-400" />
          <h4 className="text-lg font-semibold text-white">Analytics & Tracking</h4>
        </div>
        <div className="space-y-4">
          <ToggleSwitch
            label="Analytics Tracking"
            description="Help us improve BeautyCita by sharing anonymous usage data"
            checked={preferences.analytics_tracking}
            onChange={() => togglePreference('analytics_tracking')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Download className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-semibold text-white">Download Your Data</h4>
        </div>
        <p className="text-gray-400 mb-4">
          Export all your personal data including bookings, reviews, and payment history (GDPR compliant).
        </p>
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download My Data</span>
            </>
          )}
        </button>
      </div>

      {/* Cookie Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Cookie className="w-5 h-5 text-orange-400" />
          <h4 className="text-lg font-semibold text-white">Cookie Preferences</h4>
        </div>
        <p className="text-gray-400 mb-4">
          Manage your cookie consent settings.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('cookie-consent');
            window.location.reload();
          }}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
        >
          Update Cookie Preferences
        </button>
      </div>

      {/* Delete Account */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h4 className="text-lg font-semibold text-red-400">Delete Account</h4>
        </div>
        <p className="text-gray-300 mb-4">
          Permanently delete your account and all associated data. This action schedules your account for deletion in 30 days.
          You can cancel within that period.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete My Account</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30"
          >
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-2xl font-bold text-white">Delete Account</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                This action will schedule your account for permanent deletion in <strong className="text-red-400">30 days</strong>.
              </p>
              <p className="text-gray-300">
                During this period, your account will be deactivated and you can cancel the deletion by logging back in.
              </p>
              <p className="text-gray-300">
                After 30 days, all your data will be permanently deleted and cannot be recovered.
              </p>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <p className="text-yellow-300 text-sm">
                  <strong>Note:</strong> You must cancel all pending bookings before deleting your account.
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="text-red-400 font-bold">"DELETE MY ACCOUNT"</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, checked, onChange, disabled }) => {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <label className="text-white font-medium cursor-pointer" onClick={!disabled ? onChange : undefined}>
          {label}
        </label>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-600 peer-checked:to-purple-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
    </div>
  );
};

export default PrivacySettings;
