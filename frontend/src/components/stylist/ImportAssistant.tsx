import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import FreshaImportGuide from './FreshaImportGuide'
import BooksyImportGuide from './BooksyImportGuide'

interface ImportAssistantProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: (data: any) => void
}

type Platform = 'fresha' | 'booksy' | null

export default function ImportAssistant({ isOpen, onClose, onImportComplete }: ImportAssistantProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null)
  const [importedData, setImportedData] = useState<any>({})

  const handleReset = () => {
    setSelectedPlatform(null)
    setImportedData({})
  }

  const handleImportData = (data: any) => {
    setImportedData(data)
    if (onImportComplete) {
      onImportComplete(data)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <DocumentDuplicateIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Assistant</h2>
                <p className="text-sm text-gray-600">
                  Import your profile from Fresha or Booksy
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <AnimatePresence mode="wait">
              {!selectedPlatform ? (
                <motion.div
                  key="platform-selection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                    <div className="flex items-start gap-3">
                      <ExclamationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>We'll guide you through copying your information step-by-step</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>Open your existing profile in a new tab alongside this guide</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>Copy each field manually - quick, easy, and secure</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">Select your platform:</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fresha */}
                    <button
                      onClick={() => setSelectedPlatform('fresha')}
                      className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10"></div>
                      <div className="relative">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4">
                          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Fresha</h3>
                        <p className="text-white text-opacity-90 mb-4">
                          Import from your Fresha profile
                        </p>
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <span>Get Started</span>
                          <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>

                    {/* Booksy */}
                    <button
                      onClick={() => setSelectedPlatform('booksy')}
                      className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white opacity-10"></div>
                      <div className="relative">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4">
                          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Booksy</h3>
                        <p className="text-white text-opacity-90 mb-4">
                          Import from your Booksy profile
                        </p>
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <span>Get Started</span>
                          <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : selectedPlatform === 'fresha' ? (
                <motion.div
                  key="fresha-guide"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Change Platform</span>
                    </button>
                  </div>
                  <FreshaImportGuide onComplete={handleImportData} onClose={onClose} />
                </motion.div>
              ) : (
                <motion.div
                  key="booksy-guide"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Change Platform</span>
                    </button>
                  </div>
                  <BooksyImportGuide onComplete={handleImportData} onClose={onClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
