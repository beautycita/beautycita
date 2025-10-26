import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, RefreshCw, Link as LinkIcon, Unlink, AlertCircle, CheckCircle } from 'lucide-react';

interface GoogleCalendarSyncProps {
  onSyncComplete?: () => void;
}

const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({ onSyncComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setLastSyncTime(data.lastSync ? new Date(data.lastSync) : null);
        setAutoSyncEnabled(data.autoSync || false);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const connectToGoogle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Open OAuth popup
        const popup = window.open(
          data.authUrl,
          'Google Calendar Authorization',
          'width=600,height=700'
        );

        // Listen for OAuth callback
        window.addEventListener('message', async (event) => {
          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            popup?.close();
            toast.success('Connected to Google Calendar');
            setIsConnected(true);
            syncCalendar();
          }
        });
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const disconnectFromGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsConnected(false);
        setLastSyncTime(null);
        toast.success('Disconnected from Google Calendar');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect');
    }
  };

  const syncCalendar = async () => {
    setSyncing(true);
    setConflicts([]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          twoWaySync: true,
          detectConflicts: true
        })
      });

      if (response.ok) {
        const data = await response.json();

        setLastSyncTime(new Date());

        if (data.conflicts && data.conflicts.length > 0) {
          setConflicts(data.conflicts);
          toast.warning(`Sync completed with ${data.conflicts.length} conflict(s)`);
        } else {
          toast.success('Calendar synced successfully');
        }

        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const resolveConflict = async (conflictId: string, action: 'keep_local' | 'keep_google' | 'merge') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/resolve-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conflictId, action })
      });

      if (response.ok) {
        setConflicts(conflicts.filter(c => c.id !== conflictId));
        toast.success('Conflict resolved');
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  const toggleAutoSync = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/google/auto-sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !autoSyncEnabled })
      });

      if (response.ok) {
        setAutoSyncEnabled(!autoSyncEnabled);
        toast.success(`Auto-sync ${!autoSyncEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to toggle auto-sync:', error);
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-pink-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">Google Calendar</h3>
              <p className="text-sm text-gray-400">
                {isConnected ? 'Connected and syncing' : 'Not connected'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            {/* Last Sync */}
            {lastSyncTime && (
              <div className="text-sm text-gray-400">
                Last synced: {lastSyncTime.toLocaleString()}
              </div>
            )}

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <div className="text-white font-medium">Automatic Sync</div>
                <div className="text-sm text-gray-400">Sync every 15 minutes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={toggleAutoSync}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={syncCalendar}
                disabled={syncing}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                onClick={disconnectFromGoogle}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <Unlink className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connectToGoogle}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
          >
            <LinkIcon className="w-5 h-5" />
            <span>Connect Google Calendar</span>
          </button>
        )}
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">
              {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </h3>
          </div>

          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="bg-gray-800 rounded-lg p-4">
                <div className="text-white font-medium mb-2">
                  {conflict.title}
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  {new Date(conflict.time).toLocaleString()}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => resolveConflict(conflict.id, 'keep_local')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Keep Local
                  </button>
                  <button
                    onClick={() => resolveConflict(conflict.id, 'keep_google')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Keep Google
                  </button>
                  <button
                    onClick={() => resolveConflict(conflict.id, 'merge')}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                  >
                    Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">Two-Way Sync Enabled</p>
            <p>Bookings created in BeautyCita will be added to your Google Calendar, and events created in Google Calendar will appear in your booking dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarSync;
