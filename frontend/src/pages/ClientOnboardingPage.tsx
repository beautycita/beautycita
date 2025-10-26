import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MapPin, Heart, Camera, Users, BookOpen,
  ChevronRight, ChevronLeft, Check, Sparkles, Star,
  Upload, X, Search, Navigation
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface OnboardingData {
  phone: string;
  phoneVerified: boolean;
  verificationCode: string;
  location: {
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  };
  servicePreferences: string[];
  profilePicture: string | null;
  selectedStylist?: any;
}

const SERVICES = [
  { id: 'haircut', label: 'Haircut', icon: '✂️' },
  { id: 'hair-coloring', label: 'Hair Coloring', icon: '🎨' },
  { id: 'hair-styling', label: 'Hair Styling', icon: '💇' },
  { id: 'manicure', label: 'Manicure', icon: '💅' },
  { id: 'pedicure', label: 'Pedicure', icon: '🦶' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'facial', label: 'Facial', icon: '✨' },
  { id: 'waxing', label: 'Waxing', icon: '🪒' },
  { id: 'massage', label: 'Massage', icon: '💆' },
  { id: 'eyebrows', label: 'Eyebrows', icon: '👁️' },
  { id: 'eyelashes', label: 'Eyelashes', icon: '👁️‍🗨️' },
  { id: 'braiding', label: 'Braiding', icon: '🧵' }
];

const ClientOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [nearbyStylistsLoading, setNearbyStylistsLoading] = useState(false);
  const [nearbyStylist, setNearbyStylist] = useState<any[]>([]);

  const [data, setData] = useState<OnboardingData>({
    phone: '',
    phoneVerified: false,
    verificationCode: '',
    location: {
      city: '',
      state: '',
      zip: ''
    },
    servicePreferences: [],
    profilePicture: null
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/onboarding/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.completed) {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const sendVerificationCode = async () => {
    if (!data.phone || data.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: data.phone })
      });

      if (response.ok) {
        setVerificationSent(true);
        toast.success('Verification code sent!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send verification error:', error);
      toast.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!data.verificationCode || data.verificationCode.length < 4) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: data.phone,
          code: data.verificationCode
        })
      });

      if (response.ok) {
        updateData({ phoneVerified: true });
        toast.success('Phone verified successfully!');
        setTimeout(nextStep, 500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verify phone error:', error);
      toast.error('Failed to verify phone');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get city/state/zip
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );

          if (response.ok) {
            const locationData = await response.json();
            const address = locationData.address;

            updateData({
              location: {
                city: address.city || address.town || address.village || '',
                state: address.state || '',
                zip: address.postcode || '',
                latitude,
                longitude
              }
            });

            toast.success('Location detected!');
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
          toast.error('Failed to detect location');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location');
        setLoading(false);
      }
    );
  };

  const saveLocation = async () => {
    if (!data.location.city || !data.location.zip) {
      toast.error('Please enter your city and zip code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/save-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data.location)
      });

      if (response.ok) {
        toast.success('Location saved!');
        setTimeout(nextStep, 500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save location');
      }
    } catch (error) {
      console.error('Save location error:', error);
      toast.error('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (data.servicePreferences.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/save-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ services: data.servicePreferences })
      });

      if (response.ok) {
        toast.success('Preferences saved!');
        setTimeout(nextStep, 500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/upload-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        updateData({ profilePicture: result.url });
        toast.success('Profile picture uploaded!');
      } else {
        toast.error('Failed to upload picture');
      }
    } catch (error) {
      console.error('Upload picture error:', error);
      toast.error('Failed to upload picture');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      uploadProfilePicture(file);
    }
  };

  const findNearbyStylist = async () => {
    setNearbyStylistsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/stylists/nearby?lat=${data.location.latitude}&lng=${data.location.longitude}&services=${data.servicePreferences.join(',')}&limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setNearbyStylist(result.stylists || []);
      }
    } catch (error) {
      console.error('Find stylists error:', error);
      toast.error('Failed to find nearby stylists');
    } finally {
      setNearbyStylistsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 5 && data.location.latitude && data.servicePreferences.length > 0) {
      findNearbyStylist();
    }
  }, [currentStep]);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: true,
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Welcome to BeautyCita!');
        // Force page reload to refresh user state
        window.location.href = '/dashboard';
      } else {
        toast.error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setData(prev => ({
      ...prev,
      servicePreferences: prev.servicePreferences.includes(serviceId)
        ? prev.servicePreferences.filter(s => s !== serviceId)
        : [...prev.servicePreferences, serviceId]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to BeautyCita! 👋</h2>
              <p className="text-gray-400">Let's verify your phone number to get started</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateData({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  disabled={verificationSent}
                />
              </div>

              {!verificationSent ? (
                <button
                  onClick={sendVerificationCode}
                  disabled={loading || !data.phone}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={data.verificationCode}
                      onChange={(e) => updateData({ verificationCode: e.target.value })}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <button
                    onClick={verifyPhone}
                    disabled={loading || !data.verificationCode}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Phone'}
                  </button>

                  <button
                    onClick={() => setVerificationSent(false)}
                    className="w-full text-gray-400 hover:text-white text-sm"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Where are you located?</h2>
              <p className="text-gray-400">We'll find the best stylists near you</p>
            </div>

            <button
              onClick={detectLocation}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Navigation className="w-5 h-5" />
              <span>{loading ? 'Detecting...' : 'Use My Current Location'}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or enter manually</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  value={data.location.city}
                  onChange={(e) => updateData({
                    location: { ...data.location, city: e.target.value }
                  })}
                  placeholder="New York"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <input
                  type="text"
                  value={data.location.state}
                  onChange={(e) => updateData({
                    location: { ...data.location, state: e.target.value }
                  })}
                  placeholder="NY"
                  maxLength={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zip Code</label>
                <input
                  type="text"
                  value={data.location.zip}
                  onChange={(e) => updateData({
                    location: { ...data.location, zip: e.target.value }
                  })}
                  placeholder="10001"
                  maxLength={5}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={saveLocation}
              disabled={loading || !data.location.city || !data.location.zip}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">What services interest you?</h2>
              <p className="text-gray-400">Select all that apply</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    data.servicePreferences.includes(service.id)
                      ? 'border-pink-500 bg-pink-600/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <div className="text-sm font-medium text-white">{service.label}</div>
                  {data.servicePreferences.includes(service.id) && (
                    <div className="mt-2">
                      <Check className="w-5 h-5 text-pink-400 mx-auto" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="text-center text-gray-400 text-sm">
              {data.servicePreferences.length} service{data.servicePreferences.length !== 1 ? 's' : ''} selected
            </div>

            <button
              onClick={savePreferences}
              disabled={loading || data.servicePreferences.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Add a profile picture</h2>
              <p className="text-gray-400">Optional, but helps stylists recognize you</p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              {data.profilePicture ? (
                <div className="relative">
                  <img loading="lazy"
                    src={data.profilePicture}
                    alt="Profile"
                    className="w-40 h-40 rounded-full object-cover border-4 border-pink-500"
                  />
                  <button
                    onClick={() => updateData({ profilePicture: null })}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <label className="w-40 h-40 rounded-full bg-gray-800 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              <div className="text-center text-gray-400 text-sm max-w-md">
                Accepted formats: JPG, PNG, GIF (max 5MB)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={nextStep}
                disabled={!data.profilePicture}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Stylists near you</h2>
              <p className="text-gray-400">Browse top-rated professionals in your area</p>
            </div>

            {nearbyStylistsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : nearbyStylist.length > 0 ? (
              <div className="space-y-4">
                {nearbyStylist.slice(0, 3).map((stylist) => (
                  <div
                    key={stylist.id}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-pink-500 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <img loading="lazy"
                        src={stylist.profile_picture_url || '/default-avatar.png'}
                        alt={stylist.business_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{stylist.business_name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{stylist.average_rating?.toFixed(1) || '5.0'}</span>
                          <span>•</span>
                          <span>{stylist.distance?.toFixed(1) || '0.5'} mi</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/stylist/${stylist.id}`)}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No stylists found nearby. Try expanding your search area.</p>
              </div>
            )}

            <button
              onClick={nextStep}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
            >
              Continue to Tutorial
            </button>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">You're all set! 🎉</h2>
              <p className="text-gray-400">Here's how to book your first appointment</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Find a Stylist</h3>
                    <p className="text-gray-400 text-sm">Browse stylists by location, service, or rating</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Choose a Service</h3>
                    <p className="text-gray-400 text-sm">Select from their available services and pricing</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Pick a Time</h3>
                    <p className="text-gray-400 text-sm">View real-time availability and book instantly</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Confirm & Pay</h3>
                    <p className="text-gray-400 text-sm">Secure payment with booking protection</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Pro Tip</h4>
                  <p className="text-gray-300 text-sm">
                    Check stylist reviews and portfolios before booking to find the perfect match for your style!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Finishing...' : 'Start Exploring BeautyCita'}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {currentStep > 1 && currentStep < 6 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={prevStep}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientOnboardingPage;
