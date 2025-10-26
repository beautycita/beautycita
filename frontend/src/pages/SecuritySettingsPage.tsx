/**
 * Security Settings Page
 * Comprehensive security management with prominent biometric authentication
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, DevicePhoneMobileIcon, QrCodeIcon, KeyIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import QRCode from 'qrcode';

interface BiometricDevice {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string;
  credentialId: string;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  timestamp: string;
  current: boolean;
}

interface TwoFactorStatus {
  enabled: boolean;
  secret?: string;
  qrCode?: string;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginSession[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [deviceLinkQR, setDeviceLinkQR] = useState<string | null>(null);
  const [showDeviceLinkModal, setShowDeviceLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const devicesRes = await axios.get('/api/auth/webauthn/credentials');
      setBiometricDevices(devicesRes.data.credentials || []);

      const historyRes = await axios.get('/api/auth/login-history');
      setLoginHistory(historyRes.data.history || []);

      const twoFactorRes = await axios.get('/api/2fa/status');
      setTwoFactorStatus(twoFactorRes.data);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const generateDeviceLink = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/webauthn/generate-link');
      const url = response.data.url;
      
      setLinkUrl(url);
      
      const qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2
      });
      
      setDeviceLinkQR(qrCode);
      setShowDeviceLinkModal(true);
    } catch (error) {
      console.error('Failed to generate device link:', error);
      alert('Failed to generate device link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert('Biometric authentication is not supported on this device/browser.');
        return;
      }

      const optionsRes = await axios.get('/api/auth/webauthn/register/options');
      const options = optionsRes.data;

      const credential: any = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0)),
          user: {
            ...options.user,
            id: Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0))
          }
        }
      });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const credentialData = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        type: credential.type,
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject)))
        }
      };

      await axios.post('/api/auth/webauthn/register/verify', credentialData);
      
      alert('Biometric authentication set up successfully!');
      loadSecurityData();
    } catch (error) {
      console.error('Biometric setup failed:', error);
      alert('Failed to set up biometric authentication. Please try again.');
    }
  };

  const removeBiometricDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this biometric device?')) {
      return;
    }

    try {
      await axios.delete('/api/auth/webauthn/credentials/' + deviceId);
      loadSecurityData();
    } catch (error) {
      console.error('Failed to remove device:', error);
      alert('Failed to remove device. Please try again.');
    }
  };

  const setup2FA = async () => {
    try {
      const response = await axios.post('/api/2fa/setup');
      setTwoFactorStatus({
        enabled: false,
        secret: response.data.secret,
        qrCode: response.data.qrCode
      });
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      alert('Failed to setup 2FA. Please try again.');
    }
  };

  const verify2FA = async () => {
    if (!verificationCode) {
      alert('Please enter the verification code from your authenticator app.');
      return;
    }

    try {
      await axios.post('/api/2fa/verify', { token: verificationCode });
      alert('2FA enabled successfully!');
      setVerificationCode('');
      loadSecurityData();
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      alert('Invalid verification code. Please try again.');
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      await axios.post('/api/2fa/disable');
      loadSecurityData();
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      alert('Failed to disable 2FA. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const displayedHistory = showAllHistory ? loginHistory : loginHistory.slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
      </div>

      {/* Biometric Authentication - PROMINENT */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Biometric Authentication</h2>
              <p className="text-gray-600 mt-1">The fastest and most secure way to sign in</p>
            </div>
          </div>
          {biometricDevices.length > 0 && (
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={setupBiometric}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-md"
          >
            <DevicePhoneMobileIcon className="w-5 h-5" />
            <span>Set Up on This Device</span>
          </button>
          
          <button
            onClick={generateDeviceLink}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-purple-600 font-semibold py-4 px-6 rounded-lg border-2 border-purple-600 transition-colors"
          >
            <QrCodeIcon className="w-5 h-5" />
            <span>{loading ? 'Generating...' : 'Link Another Device'}</span>
          </button>
        </div>

        {biometricDevices.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Registered Devices</h3>
            <div className="space-y-2">
              {biometricDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{device.name || 'Unnamed Device'}</p>
                      <p className="text-sm text-gray-500">
                        Last used: {new Date(device.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBiometricDevice(device.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <KeyIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Authenticator App (2FA)</h2>
              <p className="text-gray-600 text-sm">Extra security with any TOTP authenticator</p>
            </div>
          </div>
          <div className={'px-3 py-1 rounded-full text-sm font-medium ' + (twoFactorStatus.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
            {twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {!twoFactorStatus.enabled && !twoFactorStatus.qrCode && (
          <button
            onClick={setup2FA}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Enable Two-Factor Authentication
          </button>
        )}

        {twoFactorStatus.qrCode && !twoFactorStatus.enabled && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Scan this QR code with your authenticator app:</h3>
              <div className="flex justify-center my-4">
                <img src={twoFactorStatus.qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Or enter this key manually:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-white px-4 py-2 rounded border text-sm font-mono">
                    {twoFactorStatus.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(twoFactorStatus.secret || '')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter verification code from app:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={6}
                />
                <button
                  onClick={verify2FA}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {twoFactorStatus.enabled && (
          <button
            onClick={disable2FA}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Disable Two-Factor Authentication
          </button>
        )}
      </div>

      {/* Login History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Login Activity</h2>
          </div>
        </div>

        <div className="space-y-2">
          {displayedHistory.map((session) => (
            <div
              key={session.id}
              className={'p-4 rounded-lg ' + (session.current ? 'bg-green-50 border border-green-200' : 'bg-gray-50')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{session.device}</p>
                    {session.current && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {session.location} • {session.ip}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{new Date(session.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {loginHistory.length > 2 && (
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="w-full mt-4 flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium py-2"
          >
            <span>{showAllHistory ? 'Show Less' : 'Show ' + (loginHistory.length - 2) + ' More'}</span>
            {showAllHistory ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Device Link Modal */}
      {showDeviceLinkModal && deviceLinkQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Link Another Device</h3>
              <button
                onClick={() => setShowDeviceLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">Scan this QR code with your other device:</p>
              
              <div className="flex justify-center">
                <img src={deviceLinkQR} alt="Device Link QR Code" className="w-64 h-64 border-4 border-purple-600 rounded-lg" />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Or copy this link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={linkUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(linkUrl)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">This link expires in 15 minutes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
