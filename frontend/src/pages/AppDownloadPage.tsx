import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface AppInfo {
  package: string;
  version: string;
  versionCode: number;
  releaseDate?: string;
  releaseNotes?: {
    version: string;
    date: string;
    changes: string[];
  };
  previousVersions?: Array<{
    version: string;
    versionCode: number;
    date: string;
    notes: string;
  }>;
  files: {
    aab: {
      available: boolean;
      size: string | null;
      path: string | null;
    };
    apk: {
      available: boolean;
      size: string | null;
      path: string | null;
    };
  };
  userRole: string;
}

const AppDownloadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchAppInfo();
  }, [user, navigate]);

  const fetchAppInfo = async () => {
    try {
      const response = await apiClient.get<AppInfo>('/app-downloads/info');
      setAppInfo(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load app information');
      setLoading(false);
    }
  };

  const downloadFile = (type: 'aab' | 'apk') => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('beautycita-auth-token') || localStorage.getItem('token');

      // Create a temporary link with token in header via fetch
      const url = `/api/app-downloads/${type}`;

      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BeautyCita-release.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error(`Error downloading ${type}:`, err);
        alert(`Failed to download ${type.toUpperCase()} file. Please try again.`);
      });
    } catch (err: any) {
      console.error(`Error downloading ${type}:`, err);
      alert(`Failed to download ${type.toUpperCase()} file. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-bold mb-4">
              🔒 ADMIN ACCESS
            </div>
            <h1 className="text-3xl font-bold mb-2">📱 BeautyCita Android App</h1>
            <p className="text-white/90">Internal Testing - Admin & Superadmin Only</p>
          </div>

          <div className="p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-bold text-yellow-800">Internal Release</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    This app is in internal testing phase. Do not distribute these files publicly.
                  </p>
                </div>
              </div>
            </div>

            {appInfo && (
              <>
                <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Package:</span>
                      <span className="ml-2 text-gray-600">{appInfo.package}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Version:</span>
                      <span className="ml-2 text-gray-600">{appInfo.version} (Build {appInfo.versionCode})</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Your Role:</span>
                      <span className="ml-2 text-gray-600 font-bold">{appInfo.userRole}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Signed:</span>
                      <span className="ml-2 text-green-600 font-bold">✓ Production Ready</span>
                    </div>
                    {appInfo.releaseDate && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-700">Release Date:</span>
                        <span className="ml-2 text-gray-600">{appInfo.releaseDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {appInfo.releaseNotes && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-5 mb-6 rounded">
                    <h3 className="font-bold text-green-800 text-lg mb-3">
                      📋 What's New in {appInfo.releaseNotes.version}
                    </h3>
                    <ul className="space-y-2">
                      {appInfo.releaseNotes.changes.map((change, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Available Downloads:</h3>

              {appInfo?.files.aab.available && (
                <button
                  onClick={() => downloadFile('aab')}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-2xl font-bold mb-1">📦 Download AAB Bundle</div>
                      <div className="text-sm opacity-90">
                        For Google Play Console Upload • {appInfo.files.aab.size}
                      </div>
                    </div>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </button>
              )}

              {appInfo?.files.apk.available && (
                <button
                  onClick={() => downloadFile('apk')}
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white p-6 rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-2xl font-bold mb-1">📲 Download APK</div>
                      <div className="text-sm opacity-90">
                        For Direct Device Installation • {appInfo.files.apk.size}
                      </div>
                    </div>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4 text-sm">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">📦 About AAB Format:</h4>
                <p className="text-gray-600">
                  Android App Bundle for Google Play Console upload.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">📲 About APK Format:</h4>
                <p className="text-gray-600">
                  Direct installation on Android devices. Enable "Install from Unknown Sources" in settings.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">🔐 Security Features:</h4>
                <p className="text-gray-600">
                  Hardware-backed encryption (Android Keystore + EncryptedSharedPreferences).
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPage;
