import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface VerificationStatus {
  status: 'verifying' | 'success' | 'error';
  message: string;
}

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'verifying',
    message: t('auth.verifyEmail.verifying')
  });

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus({
          status: 'error',
          message: t('auth.verifyEmail.invalidToken')
        });
        return;
      }

      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);

        if (response.data.success) {
          setVerificationStatus({
            status: 'success',
            message: response.data.message || t('auth.verifyEmail.successMessage')
          });

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setVerificationStatus({
            status: 'error',
            message: response.data.message || t('auth.verifyEmail.errorTitle')
          });
        }
      } catch (error: any) {
        console.error('Email verification error:', error);

        const errorMessage = error.response?.data?.message || t('auth.messages.authError');

        setVerificationStatus({
          status: 'error',
          message: errorMessage
        });
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-full shadow-xl p-8 text-center">
          {/* Verifying State */}
          {verificationStatus.status === 'verifying' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <ArrowPathIcon className="h-16 w-16 text-primary-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {t('auth.verifyEmail.verifyingTitle')}
              </h2>
              <p className="text-gray-600">
                {verificationStatus.message}
              </p>
            </div>
          )}

          {/* Success State */}
          {verificationStatus.status === 'success' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="relative">
                  <CheckCircleIcon className="h-20 w-20 text-green-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  ✨ {t('auth.verifyEmail.successTitle')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {verificationStatus.message}
                </p>
                <p className="text-sm text-gray-500">
                  {t('auth.verifyEmail.redirecting')}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full btn btn-primary rounded-full"
              >
                {t('auth.verifyEmail.goToDashboard')}
              </button>
            </div>
          )}

          {/* Error State */}
          {verificationStatus.status === 'error' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <XCircleIcon className="h-20 w-20 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  {t('auth.verifyEmail.errorTitle')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {verificationStatus.message}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full btn btn-primary rounded-full"
                >
                  {t('auth.verifyEmail.goToDashboard')}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full btn btn-secondary rounded-full"
                >
                  {t('auth.verifyEmail.retryButton')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.verifyEmail.needHelp')}{' '}
          <a href="/support" className="text-primary-600 hover:text-primary-500 font-medium">
            {t('auth.verifyEmail.contactSupport')}
          </a>
        </p>
      </div>
    </div>
  );
}
