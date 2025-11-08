import React, { useState, useEffect, useRef } from 'react';
import { PhoneIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';

interface PhoneVerificationProps {
  onVerified: (phone: string) => void;
  onCancel?: () => void;
  initialPhone?: string;
}

/**
 * Phone verification component using Twilio Verify
 *
 * Features:
 * - Auto-detects Mexico/US country code
 * - Sends SMS verification code
 * - 6-digit code input
 * - Resend functionality (60s cooldown)
 * - Error handling
 *
 * @example
 * <PhoneVerification
 *   onVerified={(phone) => console.log('Verified:', phone)}
 * />
 */
export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  onVerified,
  onCancel,
  initialPhone = '',
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [lastCountryCode, setLastCountryCode] = useState<'+52' | '+1' | null>(null);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format phone number (10 digits only)
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  // Validate phone number
  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return 'Phone number must be 10 digits';
    }
    return '';
  };

  // Detect country code based on area code
  const detectCountryCode = (phoneDigits: string): string => {
    const areaCode = phoneDigits.substring(0, 2);
    // Mexico area codes: 33 (Guadalajara), 55 (Mexico City), 81 (Monterrey), 442 (Querétaro), etc.
    const mexicoAreaCodes = ['33', '55', '81', '44', '222', '777', '656', '664', '668'];

    if (mexicoAreaCodes.some(code => phoneDigits.startsWith(code))) {
      return '+52'; // Mexico
    }
    return '+1'; // Default to US/Canada
  };

  // Send verification code
  const handleSendCode = async (forceCountryCode?: '+52' | '+1') => {
    setError('');

    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Convert to E.164 format
      // If forceCountryCode is provided (from resend), use that
      // Otherwise, detect from area code
      const countryCode = forceCountryCode || detectCountryCode(phone);
      const phoneNumber = `${countryCode}${phone}`;

      console.log(`[PHONE_VERIFY] Sending to: ${phoneNumber} (country code: ${countryCode})`);

      const response = await apiClient.post('/verify/send-code', {
        phoneNumber: phoneNumber,
      });

      if (response.success) {
        setLastCountryCode(countryCode);
        const countryName = countryCode === '+52' ? 'Mexico' : 'US/Canada';
        toast.success(`Code sent to ${countryName} number!`);
        setStep('code');
        setResendCooldown(60);
        // Focus first code input
        setTimeout(() => {
          codeInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(response.message || 'Failed to send code');
        toast.error('Failed to send code');
      }
    } catch (err: any) {
      console.error('Send code error:', err);
      setError(err.message || 'Failed to send verification code');
      toast.error('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...code];

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  // Handle backspace
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newCode = [...code];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newCode[index] = digit;
        }
      });
      setCode(newCode);

      // Auto-submit if complete
      if (digits.length === 6) {
        handleVerifyCode(digits.join(''));
      } else {
        // Focus next empty input
        codeInputRefs.current[digits.length]?.focus();
      }
    }
  };

  // Verify code
  const handleVerifyCode = async (fullCode?: string) => {
    const verificationCode = fullCode || code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the country code that was actually used to send the SMS
      const countryCode = lastCountryCode || detectCountryCode(phone);
      const phoneNumber = `${countryCode}${phone}`;

      console.log(`[PHONE_VERIFY] Verifying: ${phoneNumber} with code: ${verificationCode}`);

      const response = await apiClient.post('/verify/check-code', {
        phoneNumber: phoneNumber,
        code: verificationCode,
      });

      if (response.success && response.verified) {
        setIsVerified(true);
        toast.success('Phone verified successfully!');
        setTimeout(() => {
          onVerified(phone);
        }, 1000);
      } else {
        setError(response.message || 'Invalid verification code');
        toast.error('Invalid code');
        // Clear code inputs
        setCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      console.error('Verify code error:', err);
      setError(err.message || 'Failed to verify code');
      toast.error('Verification failed');
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend code - toggles country code to try alternate
  const handleResend = () => {
    if (resendCooldown > 0) return;
    setCode(['', '', '', '', '', '']);
    setError('');

    // Toggle country code: if we sent to Mexico (+52), try US (+1), and vice versa
    const alternateCountryCode = lastCountryCode === '+52' ? '+1' : '+52';
    const countryName = alternateCountryCode === '+52' ? 'Mexico' : 'US/Canada';

    if (lastCountryCode) {
      toast.success(`Trying ${countryName} number...`);
    }

    handleSendCode(alternateCountryCode);
  };

  // Change phone number
  const handleChangePhone = () => {
    setStep('phone');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  if (isVerified) {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Phone Verified!
        </h3>
        <p className="text-gray-600">
          Your phone number has been successfully verified.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {step === 'phone' ? (
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
              <PhoneIcon className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Phone Number
            </h3>
            <p className="text-gray-600">
              We'll send you a verification code to confirm your number
            </p>
          </div>

          <div className="space-y-4">
            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="5551234567"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter 10 digits (no country code)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Send Code Button */}
            <button
              onClick={handleSendCode}
              disabled={loading || phone.length !== 10}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={loading}
                className="w-full py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
              <PhoneIcon className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Enter Verification Code
            </h3>
            <p className="text-gray-600">
              We sent a 6-digit code to <strong>{phone}</strong>
            </p>
            <button
              onClick={handleChangePhone}
              className="text-sm text-pink-600 hover:text-pink-700 mt-1"
            >
              Change number
            </button>
          </div>

          {/* Code Inputs */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handleCodePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (codeInputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/50 transition-all"
                disabled={loading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
              <XCircleIcon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Resend Code */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm font-medium text-pink-600 hover:text-pink-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Code'}
            </button>
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyCode()}
            disabled={loading || code.some(d => !d)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify Phone Number'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
