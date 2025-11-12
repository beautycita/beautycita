import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  UserCircleIcon,
  HeartIcon,
  MapPinIcon,
  CameraIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  CheckCircleIcon,
  XMarkIcon,
  BriefcaseIcon,
  ScissorsIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { usePageMeta } from '../hooks/usePageMeta'
import toast from 'react-hot-toast'

/**
 * Two-Part Onboarding Test Page
 *
 * Part 1: Basic Registration (CLIENT role)
 * - Username, email verification, avatar, interests
 * - Result: User can browse and book stylists immediately
 *
 * Part 2: Stylist Upgrade (STYLIST role) - Optional
 * - Business details, services, portfolio, Stripe Connect
 * - Result: User becomes a stylist with dashboard access
 */

const SERVICE_INTERESTS = [
  { id: 'hair', label: 'Hair Styling', icon: '💇', gradient: 'from-purple-500 to-pink-500' },
  { id: 'nails', label: 'Nails', icon: '💅', gradient: 'from-pink-500 to-rose-500' },
  { id: 'makeup', label: 'Makeup', icon: '💄', gradient: 'from-rose-500 to-red-500' },
  { id: 'skincare', label: 'Skincare', icon: '✨', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'massage', label: 'Massage', icon: '💆', gradient: 'from-green-500 to-emerald-500' },
  { id: 'waxing', label: 'Waxing', icon: '🌟', gradient: 'from-yellow-500 to-orange-500' },
]

const SERVICE_CATEGORIES = [
  'Hair Styling',
  'Hair Coloring',
  'Nails',
  'Makeup',
  'Skincare',
  'Massage',
  'Waxing',
  'Lashes',
  'Brows',
  'Other'
]

export default function OnboardingTestPage() {
  usePageMeta({
    title: 'Two-Part Onboarding Test - BeautyCita',
    description: 'Test the complete two-part onboarding flow',
  })

  const [part, setPart] = useState<1 | 2>(1)
  const [currentStep, setCurrentStep] = useState(1)

  // Part 1 state
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [serviceInterests, setServiceInterests] = useState<string[]>([])
  const [location, setLocation] = useState('')

  // Part 2 state
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
  const [services, setServices] = useState<Array<{
    name: string
    category: string
    duration: number
    price: number
  }>>([{ name: '', category: SERVICE_CATEGORIES[0], duration: 60, price: 50 }])
  const [portfolioCount, setPortfolioCount] = useState(0)

  const part1TotalSteps = 4
  const part2TotalSteps = 4

  const totalSteps = part === 1 ? part1TotalSteps : part2TotalSteps

  const handlePart1Complete = () => {
    toast.success('🎉 Part 1 Complete! You now have CLIENT access')
    setTimeout(() => {
      setPart(2)
      setCurrentStep(1)
      toast('Ready to become a stylist? Complete Part 2!', { icon: '💇' })
    }, 1500)
  }

  const handlePart2Complete = () => {
    toast.success('🎊 Onboarding Complete! You are now a STYLIST')
    setTimeout(() => {
      toast('Redirecting to your dashboard...', { icon: '🚀' })
    }, 1500)
  }

  const addService = () => {
    setServices([...services, { name: '', category: SERVICE_CATEGORIES[0], duration: 60, price: 50 }])
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: string, value: any) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center space-x-3 mb-6"
          >
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <SparklesIcon className="w-10 h-10 text-purple-600" />
            </div>
            <span className="text-4xl font-serif font-bold text-white drop-shadow-lg">
              BeautyCita
            </span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
            {part === 1 ? 'Create Your Account' : 'Become a Stylist'}
          </h1>
          <p className="text-white/90 text-lg">
            Part {part} of 2 • Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Part Indicator */}
        <div className="mb-6 flex gap-3">
          <div className={`flex-1 h-3 rounded-full transition-all ${part === 1 ? 'bg-white shadow-lg' : 'bg-white/30'}`} />
          <div className={`flex-1 h-3 rounded-full transition-all ${part === 2 ? 'bg-white shadow-lg' : 'bg-white/30'}`} />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1
              const isCompleted = stepNum < currentStep
              const isCurrent = stepNum === currentStep

              return (
                <div key={stepNum} className="flex items-center flex-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        isCompleted
                          ? 'bg-white text-green-600 shadow-xl'
                          : isCurrent
                          ? 'bg-white text-purple-600 shadow-2xl scale-110'
                          : 'bg-white/30 text-white'
                      }`}
                    >
                      {isCompleted ? <CheckCircleSolid className="w-7 h-7" /> : stepNum}
                    </div>
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 bg-white rounded-2xl"
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  {index < totalSteps - 1 && (
                    <div className="flex-1 h-2 mx-2 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          layout
        >
          <AnimatePresence mode="wait">
            {/* PART 1: CLIENT REGISTRATION */}
            {part === 1 && (
              <>
                {/* Part 1, Step 1: Username */}
                {currentStep === 1 && (
                  <motion.div
                    key="p1-step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <AtSymbolIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        Choose Your Username
                      </h2>
                      <p className="text-gray-600 text-lg">Pick a unique @username that represents you</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500 text-2xl font-bold">@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-semibold text-lg"
                            placeholder="username"
                            maxLength={20}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">3-20 characters, lowercase letters, numbers, and underscores only</p>
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => {
                          if (username.length >= 3) {
                            setCurrentStep(2)
                          } else {
                            toast.error('Username must be at least 3 characters')
                          }
                        }}
                        disabled={username.length < 3}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                      >
                        Continue
                        <ArrowRightIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Part 1, Step 2: Email */}
                {currentStep === 2 && (
                  <motion.div
                    key="p1-step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <EnvelopeIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Verify Your Email
                      </h2>
                      <p className="text-gray-600 text-lg">Enter your email and verification code</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium text-lg"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          className="w-full px-5 py-5 border-2 border-gray-200 rounded-2xl text-center text-4xl font-bold font-mono tracking-widest focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                          placeholder="000000"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            if (email && verificationCode.length === 6) {
                              setCurrentStep(3)
                            } else {
                              toast.error('Please enter email and 6-digit code')
                            }
                          }}
                          disabled={!email || verificationCode.length !== 6}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                          Continue
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Part 1, Step 3: Avatar */}
                {currentStep === 3 && (
                  <motion.div
                    key="p1-step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <UserCircleIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        Choose Your Avatar
                      </h2>
                      <p className="text-gray-600 text-lg">Click below to simulate selecting an avatar</p>
                    </div>

                    <div className="space-y-6">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAvatar('selected')
                          toast.success('Avatar selected!')
                        }}
                        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-3xl hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                      >
                        <CameraIcon className="w-16 h-16 text-purple-500 mx-auto mb-2" />
                        <p className="text-lg font-bold text-gray-900">
                          {selectedAvatar ? '✅ Avatar Selected' : 'Click to Select Avatar'}
                        </p>
                      </button>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            if (selectedAvatar) {
                              setCurrentStep(4)
                            } else {
                              toast.error('Please select an avatar')
                            }
                          }}
                          disabled={!selectedAvatar}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                          Continue
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Part 1, Step 4: Interests */}
                {currentStep === 4 && (
                  <motion.div
                    key="p1-step4"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <HeartIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                        What Interests You?
                      </h2>
                      <p className="text-gray-600 text-lg">Select at least one service interest</p>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                          Service Interests
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {SERVICE_INTERESTS.map((service, index) => {
                            const isSelected = serviceInterests.includes(service.id)

                            return (
                              <motion.button
                                key={service.id}
                                type="button"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => {
                                  setServiceInterests(
                                    isSelected
                                      ? serviceInterests.filter(i => i !== service.id)
                                      : [...serviceInterests, service.id]
                                  )
                                }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                                  isSelected
                                    ? `bg-gradient-to-br ${service.gradient} border-transparent text-white shadow-xl`
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-lg'
                                }`}
                              >
                                <div className="text-3xl mb-2">{service.icon}</div>
                                <div className="font-bold text-sm">{service.label}</div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                                  >
                                    <CheckCircleSolid className="w-6 h-6 text-green-500" />
                                  </motion.div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Location (Optional)
                        </label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium"
                            placeholder="City, State"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            if (serviceInterests.length > 0) {
                              handlePart1Complete()
                            } else {
                              toast.error('Select at least one interest')
                            }
                          }}
                          disabled={serviceInterests.length === 0}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                          <StarIcon className="w-5 h-5" />
                          Complete Part 1
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* PART 2: STYLIST UPGRADE */}
            {part === 2 && (
              <>
                {/* Part 2, Step 1: Business Profile */}
                {currentStep === 1 && (
                  <motion.div
                    key="p2-step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <BuildingStorefrontIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Business Profile
                      </h2>
                      <p className="text-gray-600 text-lg">Tell us about your business</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium text-lg"
                          placeholder="Bella's Beauty Salon"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Bio / Description
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium resize-none"
                          placeholder="Tell clients about your experience, specialties, and what makes your services unique..."
                        />
                        <p className="text-xs text-gray-500 mt-2">{bio.length} / 200 minimum characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                          Business Location
                        </label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                          <input
                            type="text"
                            value={businessLocation}
                            onChange={(e) => setBusinessLocation(e.target.value)}
                            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium"
                            placeholder="123 Main St, Los Angeles, CA 90001"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => {
                            setPart(1)
                            setCurrentStep(4)
                            toast('Back to Part 1', { icon: '⬅️' })
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            if (businessName && bio.length >= 200 && businessLocation) {
                              setCurrentStep(2)
                            } else {
                              toast.error('Please complete all fields (bio must be 200+ chars)')
                            }
                          }}
                          disabled={!businessName || bio.length < 200 || !businessLocation}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                          Continue
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Part 2, Step 2: Services */}
                {currentStep === 2 && (
                  <motion.div
                    key="p2-step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <ScissorsIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
                        Your Services
                      </h2>
                      <p className="text-gray-600 text-lg">Add at least one service you offer</p>
                    </div>

                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                      {services.map((service, index) => (
                        <div key={index} className="p-4 border-2 border-gray-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700">Service {index + 1}</span>
                            {services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeService(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="Service name (e.g., Women's Haircut)"
                          />

                          <select
                            value={service.category}
                            onChange={(e) => updateService(index, 'category', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          >
                            {SERVICE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Duration (min)</label>
                              <input
                                type="number"
                                value={service.duration}
                                onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                min={15}
                                step={15}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Price ($)</label>
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                min={1}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addService}
                        className="w-full py-3 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 font-semibold hover:bg-purple-50 transition-all"
                      >
                        + Add Another Service
                      </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                      >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const hasValidService = services.some(s => s.name && s.duration > 0 && s.price > 0)
                          if (hasValidService) {
                            setCurrentStep(3)
                          } else {
                            toast.error('Add at least one complete service')
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-lg"
                      >
                        Continue
                        <ArrowRightIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Part 2, Step 3: Portfolio */}
                {currentStep === 3 && (
                  <motion.div
                    key="p2-step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <CameraIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        Portfolio
                      </h2>
                      <p className="text-gray-600 text-lg">Showcase your work (optional)</p>
                    </div>

                    <div className="space-y-6">
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioCount(portfolioCount + 1)
                          toast.success(`Portfolio image ${portfolioCount + 1} added!`)
                        }}
                        className="w-full p-12 border-2 border-dashed border-gray-300 rounded-3xl hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                      >
                        <CameraIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          {portfolioCount > 0 ? `${portfolioCount} Image${portfolioCount > 1 ? 's' : ''} Added` : 'Click to Add Portfolio Images'}
                        </p>
                        <p className="text-sm text-gray-500">Upload 3-10 images of your best work</p>
                      </button>

                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Pro Tip:</strong> Stylists with portfolios get 3x more bookings! Show your best hair, nails, and makeup work.
                        </p>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-orange-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          {portfolioCount > 0 ? 'Continue' : 'Skip for Now'}
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Part 2, Step 4: Stripe Connect */}
                {currentStep === 4 && (
                  <motion.div
                    key="p2-step4"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <CurrencyDollarIcon className="w-14 h-14 text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                        Payment Setup
                      </h2>
                      <p className="text-gray-600 text-lg">Connect Stripe to receive payments</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <CurrencyDollarIcon className="w-9 h-9 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              Secure Payment Processing
                            </h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              We use Stripe Connect to handle all payments securely. You'll be redirected to Stripe to:
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                          {[
                            'Verify your identity',
                            'Add your bank account for payouts',
                            'Complete tax information',
                            'Review and accept Stripe terms'
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-800">
                              <CheckCircleSolid className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="bg-white/50 rounded-xl p-4">
                          <p className="text-xs text-gray-600">
                            <strong>⚡ Fast payouts:</strong> Receive payments within 2-5 business days.
                            BeautyCita takes a 10% platform fee. You keep 90%.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <ArrowLeftIcon className="w-5 h-5" />
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={handlePart2Complete}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-lg"
                        >
                          <BriefcaseIcon className="w-5 h-5" />
                          Connect Stripe & Finish
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-8">
          {part === 1
            ? 'Part 1: Basic registration gives you CLIENT access to browse and book'
            : 'Part 2: Complete your stylist profile to start accepting bookings'
          }
        </p>
      </motion.div>
    </div>
  )
}
