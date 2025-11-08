import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import QRCodeStyling from 'qr-code-styling'
import {
  QrCodeIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  PhotoIcon,
  SwatchIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { getMediaUrl } from '@/config/media'
import toast from 'react-hot-toast'

type QRType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard'
type DotType = 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'
type CornerSquareType = 'dot' | 'square' | 'extra-rounded'
type CornerDotType = 'dot' | 'square'

interface QRPreset {
  name: string
  icon: string
  dotsColor: string
  cornersSquareColor: string
  cornersDotColor: string
  backgroundColor: string
  dotsType: DotType
  cornersSquareType: CornerSquareType
  cornersDotType: CornerDotType
  image?: string
}

const BC_PRESETS: QRPreset[] = [
  {
    name: 'BeautyCita Classic',
    icon: '💅',
    dotsColor: '#ec4899', // pink-500
    cornersSquareColor: '#9333ea', // purple-600
    cornersDotColor: '#3b82f6', // blue-500
    backgroundColor: '#ffffff',
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot',
    image: getMediaUrl('brand/logo-icon.svg')
  },
  {
    name: 'Purple Dream',
    icon: '💜',
    dotsColor: '#9333ea',
    cornersSquareColor: '#a855f7',
    cornersDotColor: '#c084fc',
    backgroundColor: '#faf5ff',
    dotsType: 'classy-rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot'
  },
  {
    name: 'Pink Vibes',
    icon: '🌸',
    dotsColor: '#ec4899',
    cornersSquareColor: '#f472b6',
    cornersDotColor: '#f9a8d4',
    backgroundColor: '#fdf2f8',
    dotsType: 'classy',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot'
  },
  {
    name: 'Ocean Blue',
    icon: '🌊',
    dotsColor: '#3b82f6',
    cornersSquareColor: '#60a5fa',
    cornersDotColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    dotsType: 'dots',
    cornersSquareType: 'dot',
    cornersDotType: 'square'
  },
  {
    name: 'Gradient Magic',
    icon: '✨',
    dotsColor: '#ec4899',
    cornersSquareColor: '#9333ea',
    cornersDotColor: '#3b82f6',
    backgroundColor: '#ffffff',
    dotsType: 'extra-rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot'
  },
  {
    name: 'Dark Mode',
    icon: '🌙',
    dotsColor: '#ec4899',
    cornersSquareColor: '#9333ea',
    cornersDotColor: '#3b82f6',
    backgroundColor: '#1f2937',
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot'
  }
]

export default function QRCodeGenerator() {
  const [qrType, setQrType] = useState<QRType>('url')
  const [qrData, setQrData] = useState('https://beautycita.com')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>(BC_PRESETS[0].image || '')
  const [showCustomColors, setShowCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState(BC_PRESETS[0])

  const qrCodeRef = useRef<HTMLDivElement>(null)
  const qrCodeInstance = useRef<QRCodeStyling | null>(null)

  // Initialize QR code
  useEffect(() => {
    if (!qrCodeRef.current) return

    const preset = BC_PRESETS[selectedPreset]
    const colors = showCustomColors ? customColors : preset

    qrCodeInstance.current = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'canvas',
      data: qrData,
      image: logoUrl || undefined,
      dotsOptions: {
        color: colors.dotsColor,
        type: colors.dotsType
      },
      cornersSquareOptions: {
        color: colors.cornersSquareColor,
        type: colors.cornersSquareType
      },
      cornersDotOptions: {
        color: colors.cornersDotColor,
        type: colors.cornersDotType
      },
      backgroundOptions: {
        color: colors.backgroundColor
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 8,
        imageSize: 0.4
      }
    })

    qrCodeRef.current.innerHTML = ''
    qrCodeInstance.current.append(qrCodeRef.current)
  }, [qrData, selectedPreset, showCustomColors, customColors, logoUrl])

  const handlePresetChange = (index: number) => {
    setSelectedPreset(index)
    setShowCustomColors(false)
    const preset = BC_PRESETS[index]
    if (preset.image) {
      setLogoUrl(preset.image)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      toast.success('Logo uploaded!')
    }
  }

  const downloadQR = (extension: 'png' | 'svg' | 'jpeg') => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: `beautycita-qr-${Date.now()}`,
        extension
      })
      toast.success(`QR code downloaded as ${extension.toUpperCase()}`)
    }
  }

  const copyToClipboard = async () => {
    if (qrCodeInstance.current) {
      const blob = await qrCodeInstance.current.getRawData('png')
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        toast.success('QR code copied to clipboard!')
      }
    }
  }

  const generateQRData = () => {
    // This would be expanded based on qrType
    return qrData
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl">
              <QrCodeIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              QR Code Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Create stunning branded QR codes for your marketing campaigns
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - QR Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* QR Code Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-500" />
                Preview
              </h2>

              <div className="flex justify-center mb-6">
                <div
                  ref={qrCodeRef}
                  className="bg-white p-4 rounded-2xl shadow-lg"
                />
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadQR('png')}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  PNG
                </button>
                <button
                  onClick={() => downloadQR('svg')}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  SVG
                </button>
                <button
                  onClick={() => downloadQR('jpeg')}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  JPEG
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-3 border-2 border-purple-500 text-purple-600 dark:text-purple-400 rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                  Copy
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <SwatchIcon className="w-6 h-6 text-pink-500" />
                Brand Presets
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BC_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetChange(index)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      selectedPreset === index && !showCustomColors
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{preset.icon}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* QR Content */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                QR Code Content
              </h2>

              {/* Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  Content Type
                </label>
                <select
                  value={qrType}
                  onChange={(e) => setQrType(e.target.value as QRType)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="url">Website URL</option>
                  <option value="text">Plain Text</option>
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="sms">SMS Message</option>
                  <option value="wifi">WiFi Network</option>
                  <option value="vcard">vCard Contact</option>
                </select>
              </div>

              {/* Data Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  {qrType === 'url' ? 'Website URL' :
                   qrType === 'email' ? 'Email Address' :
                   qrType === 'phone' ? 'Phone Number' :
                   qrType === 'text' ? 'Text Content' : 'Content'}
                </label>
                <textarea
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder={
                    qrType === 'url' ? 'https://beautycita.com' :
                    qrType === 'email' ? 'hello@beautycita.com' :
                    qrType === 'phone' ? '+52 123 456 7890' :
                    'Enter your content...'
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:bg-gray-700 dark:text-white transition-all resize-none"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <PhotoIcon className="w-6 h-6 text-blue-500" />
                Logo (Optional)
              </h2>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-purple-500 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {logoFile ? logoFile.name : 'Click to upload logo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG (Max 2MB)
                  </p>
                </label>
              </div>

              {logoUrl && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  Logo active in QR code
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                Pro Tips
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>✓ Test your QR code before printing</li>
                <li>✓ Use high contrast colors for better scanning</li>
                <li>✓ Keep logo size under 40% for reliability</li>
                <li>✓ SVG format is best for print materials</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
