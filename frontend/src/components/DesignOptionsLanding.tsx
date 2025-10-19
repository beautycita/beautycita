import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const DesignOptionsLanding: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const navigate = useNavigate()

  const designOptions = [
    {
      id: 'option-c',
      title: 'Social Beauty',
      subtitle: 'Gen Z Aesthetic',
      description: 'TikTok-style swipe navigation, vibrant gradients, heart animations, and social proof emphasis. Perfect for young, social media-savvy beauty enthusiasts.',
      features: ['Social proof focus', 'Mobile-first design', 'Viral animations', 'Community-driven'],
      color: 'from-pink-500 via-purple-500 to-indigo-500',
      emoji: '📱',
      target: 'Young beauty enthusiasts, social media savvy'
    },
    {
      id: 'option-a',
      title: 'Motion Luxe',
      subtitle: 'Premium Artistic',
      description: 'Resource-intensive animations, asymmetrical layouts, lipstick stroke effects, and sophisticated motion graphics. For luxury beauty experiences.',
      features: ['Sophisticated animations', 'Asymmetrical design', 'Luxury branding', 'Premium experience'],
      color: 'from-rose-600 via-pink-600 to-purple-600',
      emoji: '✨',
      target: 'Premium beauty clients, luxury experience seekers'
    },
    {
      id: 'option-b',
      title: 'Clinical Precision',
      subtitle: 'Medical Trust',
      description: 'Medical spa aesthetic with certification badges, before/after sliders, safety metrics, and trust-focused design elements.',
      features: ['Medical credibility', 'Safety emphasis', 'Trust indicators', 'Professional aesthetic'],
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      emoji: '🏥',
      target: 'Professional treatments, trust-focused clients'
    }
  ]

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId)
    setTimeout(() => {
      navigate(`/${optionId}`)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-pink-500/20 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-48 h-48 bg-blue-500/20 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 p-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.h1
            className="text-4xl font-bold text-white"
            whileHover={{ scale: 1.05 }}
          >
            BeautyCita
          </motion.h1>
          <motion.p
            className="text-white/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Choose Your Design Experience
          </motion.p>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16">
        <motion.div
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Three Design<br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Philosophies
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Each option represents a different approach to beauty booking, designed for distinct
            audiences with the same powerful backend system.
          </p>
        </motion.div>

        {/* Design Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {designOptions.map((option, index) => (
            <motion.div
              key={option.id}
              className="relative group cursor-pointer"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
              whileHover={{ scale: 1.02, y: -10 }}
              onClick={() => handleOptionClick(option.id)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-20 rounded-3xl blur-xl group-hover:opacity-30 transition-opacity duration-300`} />

              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 group-hover:border-white/40 transition-all duration-300">
                <div className="text-6xl mb-6">{option.emoji}</div>

                <h3 className="text-3xl font-bold text-white mb-2">{option.title}</h3>
                <p className="text-lg text-white/80 mb-4">{option.subtitle}</p>

                <p className="text-white/70 mb-6 leading-relaxed">
                  {option.description}
                </p>

                <div className="space-y-2 mb-6">
                  {option.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature}
                      className="flex items-center text-white/80"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.2 + featureIndex * 0.1 }}
                    >
                      <span className="w-2 h-2 bg-white/60 rounded-3xl mr-3" />
                      {feature}
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-white/20 pt-4">
                  <p className="text-sm text-white/60 mb-4">Target Audience:</p>
                  <p className="text-white/80 font-medium">{option.target}</p>
                </div>

                <motion.button
                  className={`w-full mt-6 py-3 bg-gradient-to-r ${option.color} text-white font-semibold rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Experience This Design
                </motion.button>

                {/* Selection Indicator */}
                <AnimatePresence>
                  {selectedOption === option.id && (
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-3xl border-2 border-white/60"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.1, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="bg-white text-gray-900 px-6 py-3 rounded-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          Loading...
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Matrix */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Feature Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 text-white/80">Feature</th>
                  <th className="text-center py-3">Social Beauty</th>
                  <th className="text-center py-3">Motion Luxe</th>
                  <th className="text-center py-3">Clinical Precision</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Navigation Style', social: 'Swipe-friendly', luxe: 'Flowing, artistic', clinical: 'Grid-based, clear' },
                  { feature: 'Animation Level', social: 'Playful & vibrant', luxe: 'Sophisticated & complex', clinical: 'Minimal & precise' },
                  { feature: 'Trust Signals', social: 'Social proof', luxe: 'Luxury branding', clinical: 'Certifications' },
                  { feature: 'Color Palette', social: 'Vibrant, trending', luxe: 'Sophisticated gradients', clinical: 'Medical whites/blues' },
                  { feature: 'Mobile Focus', social: 'Thumb-optimized', luxe: 'Touch gestures', clinical: 'Precise tapping' }
                ].map((row, index) => (
                  <motion.tr
                    key={row.feature}
                    className="border-b border-white/10"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <td className="py-3 text-white/90 font-medium">{row.feature}</td>
                    <td className="py-3 text-center text-white/70">{row.social}</td>
                    <td className="py-3 text-center text-white/70">{row.luxe}</td>
                    <td className="py-3 text-center text-white/70">{row.clinical}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <p className="text-white/60">
            All designs share the same robust backend with time-sensitive booking,
            payment processing, and SMS notifications.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default DesignOptionsLanding