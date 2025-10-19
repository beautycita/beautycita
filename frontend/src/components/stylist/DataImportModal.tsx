import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CloudArrowUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface DataImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => void
}

type Platform = 'fresha' | 'booksy' | 'square' | 'vagaro' | 'manual'

const PLATFORMS = [
  { id: 'fresha', name: 'Fresha', logo: '🌿', color: 'from-green-500 to-emerald-500' },
  { id: 'booksy', name: 'Booksy', logo: '📅', color: 'from-blue-500 to-cyan-500' },
  { id: 'square', name: 'Square', logo: '⬛', color: 'from-gray-700 to-gray-900' },
  { id: 'vagaro', name: 'Vagaro', logo: '💼', color: 'from-purple-500 to-pink-500' },
  { id: 'manual', name: 'Manual Upload', logo: '📄', color: 'from-orange-500 to-red-500' },
]

const IMPORT_GUIDES = {
  fresha: {
    title: 'Export from Fresha',
    steps: [
      {
        step: 1,
        title: 'Log in to Fresha',
        description: 'Go to connect.fresha.com and log in to your account'
      },
      {
        step: 2,
        title: 'Navigate to Settings',
        description: 'Click on the Settings icon in the left sidebar'
      },
      {
        step: 3,
        title: 'Go to Data Export',
        description: 'Find "Data Export" under Account Settings'
      },
      {
        step: 4,
        title: 'Select Data Types',
        description: 'Choose: Services, Clients, Appointments, and Business Info'
      },
      {
        step: 5,
        title: 'Download CSV Files',
        description: 'Click "Export" and download all CSV files to your computer'
      },
      {
        step: 6,
        title: 'Upload Here',
        description: 'Upload the CSV files below and we\'ll handle the rest'
      }
    ]
  },
  booksy: {
    title: 'Export from Booksy',
    steps: [
      {
        step: 1,
        title: 'Log in to Booksy Biz',
        description: 'Go to booksy.com/biz and sign in'
      },
      {
        step: 2,
        title: 'Open Menu',
        description: 'Click the hamburger menu (☰) in the top left'
      },
      {
        step: 3,
        title: 'Go to Settings',
        description: 'Scroll down and select "Settings"'
      },
      {
        step: 4,
        title: 'Find Data Export',
        description: 'Look for "Export Data" or "Download Data"'
      },
      {
        step: 5,
        title: 'Request Export',
        description: 'Select all data types and request the export. You\'ll receive an email with download links.'
      },
      {
        step: 6,
        title: 'Upload Files',
        description: 'Download the files from your email and upload them below'
      }
    ]
  },
  square: {
    title: 'Export from Square Appointments',
    steps: [
      {
        step: 1,
        title: 'Log in to Square',
        description: 'Go to squareup.com/dashboard and log in'
      },
      {
        step: 2,
        title: 'Navigate to Reports',
        description: 'Click "Reports" in the left navigation menu'
      },
      {
        step: 3,
        title: 'Select Data Type',
        description: 'Choose "Services", "Staff", or "Customers" reports'
      },
      {
        step: 4,
        title: 'Set Date Range',
        description: 'Select "All Time" to get complete data'
      },
      {
        step: 5,
        title: 'Export to CSV',
        description: 'Click "Export" button and choose CSV format'
      },
      {
        step: 6,
        title: 'Upload Files',
        description: 'Repeat for each data type and upload all CSV files below'
      }
    ]
  },
  vagaro: {
    title: 'Export from Vagaro',
    steps: [
      {
        step: 1,
        title: 'Log in to Vagaro Pro',
        description: 'Go to pro.vagaro.com and sign in'
      },
      {
        step: 2,
        title: 'Go to Setup',
        description: 'Click "Setup" in the top navigation bar'
      },
      {
        step: 3,
        title: 'Business Settings',
        description: 'Select "Business Settings" from the dropdown'
      },
      {
        step: 4,
        title: 'Find Export Option',
        description: 'Look for "Export Business Data" or contact Vagaro support'
      },
      {
        step: 5,
        title: 'Request Data',
        description: 'Submit a data export request. Vagaro will email you the files.'
      },
      {
        step: 6,
        title: 'Upload Files',
        description: 'Once received, upload the files below'
      }
    ]
  },
  manual: {
    title: 'Manual CSV Upload',
    steps: [
      {
        step: 1,
        title: 'Prepare Your Files',
        description: 'Create CSV files with your services, business info, etc.'
      },
      {
        step: 2,
        title: 'Use Our Template',
        description: 'Download our CSV template to ensure correct formatting'
      },
      {
        step: 3,
        title: 'Fill in Your Data',
        description: 'Add your services, prices, descriptions, and other info'
      },
      {
        step: 4,
        title: 'Save as CSV',
        description: 'Make sure to save files in .csv format'
      },
      {
        step: 5,
        title: 'Upload Files',
        description: 'Upload your CSV files using the uploader below'
      }
    ]
  }
}

export default function DataImportModal({ isOpen, onClose, onImport }: DataImportModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleProcessImport = async () => {
    if (uploadedFiles.length === 0) {
      return
    }

    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      // Mock imported data
      const mockData = {
        businessName: 'Imported Business Name',
        bio: 'Professional with years of experience imported from ' + selectedPlatform,
        address: {
          address: '123 Import St',
          city: 'Sample City',
          state: 'CA',
          zipCode: '90210'
        },
        services: [
          { name: 'Imported Service 1', description: 'From your previous platform', duration: 60, price: 50, category: 'Hair' },
          { name: 'Imported Service 2', description: 'From your previous platform', duration: 45, price: 40, category: 'Nails' }
        ]
      }

      onImport(mockData)
      setIsProcessing(false)
      onClose()
    }, 2000)
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudArrowUpIcon className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Import Your Data</h2>
                  <p className="text-white/80 text-sm">Bring your existing business data to BeautyCita</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
              {/* Left: Platform Selection */}
              <div className="p-6 border-r border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Choose Your Current Platform</h3>

                <div className="space-y-3">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id as Platform)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPlatform === platform.id
                          ? `bg-gradient-to-r ${platform.color} text-white border-transparent`
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.logo}</span>
                        <span className="font-semibold">{platform.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* File Upload Section */}
                {selectedPlatform && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-3">Upload Your Files</h4>

                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition-colors"
                    >
                      <DocumentArrowDownIcon className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload CSV/Excel files</span>
                    </label>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">{uploadedFiles.length} file(s) uploaded:</p>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={handleProcessImport}
                          disabled={isProcessing}
                          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : 'Import Data'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Step-by-Step Guide */}
              <div className="p-6 bg-gray-50 overflow-y-auto max-h-[600px]">
                {selectedPlatform ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-6">
                      {IMPORT_GUIDES[selectedPlatform].title}
                    </h3>

                    <div className="space-y-4">
                      {IMPORT_GUIDES[selectedPlatform].steps.map((stepData) => (
                        <div
                          key={stepData.step}
                          className="bg-white p-4 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{stepData.step}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{stepData.title}</h4>
                              <p className="text-sm text-gray-600">{stepData.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedPlatform === 'manual' && (
                      <div className="mt-6">
                        <a
                          href="/templates/beautycita-import-template.csv"
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <DocumentArrowDownIcon className="w-5 h-5" />
                          Download CSV Template
                        </a>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-900">
                        <strong>💡 Tip:</strong> Make sure to export ALL data types from your current platform for the best import experience.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <CloudArrowUpIcon className="w-20 h-20 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Platform</h3>
                    <p className="text-gray-600 max-w-sm">
                      Choose your current booking platform from the list on the left to see detailed export instructions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
