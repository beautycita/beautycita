import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { createWorker } from 'tesseract.js'
import toast from 'react-hot-toast'

interface CreditCardFormProps {
  isDarkMode: boolean
  onSubmit: (data: {
    cardNumber: string
    expiryMonth: string
    expiryYear: string
    cvv: string
    cardholderName: string
  }) => void
  onCancel: () => void
}

export default function CreditCardForm({ isDarkMode, onSubmit, onCancel }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '')
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    return formatted.slice(0, 19) // 16 digits + 3 spaces
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Could not access camera')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setCapturedImage(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setCapturedImage(imageData)
        stopCamera()
        processImage(imageData)
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        processImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    toast.loading('Scanning card...', { id: 'ocr' })

    try {
      const worker = await createWorker('eng')
      const { data: { text } } = await worker.recognize(imageData)
      await worker.terminate()

      // Parse credit card information from OCR text
      parseCardInfo(text)
      toast.success('Card scanned successfully!', { id: 'ocr' })
    } catch (error) {
      console.error('OCR error:', error)
      toast.error('Failed to scan card. Please enter manually.', { id: 'ocr' })
    } finally {
      setIsProcessing(false)
    }
  }

  const parseCardInfo = (text: string) => {
    const cleaned = text.replace(/\s/g, '')

    // Extract card number (16 digits)
    const cardNumberMatch = cleaned.match(/\d{16}/)
    if (cardNumberMatch) {
      setCardNumber(formatCardNumber(cardNumberMatch[0]))
    }

    // Extract expiry date (MM/YY or MM/YYYY)
    const expiryMatch = text.match(/(\d{2})\/(\d{2,4})/)
    if (expiryMatch) {
      setExpiryMonth(expiryMatch[1])
      const year = expiryMatch[2]
      setExpiryYear(year.length === 2 ? `20${year}` : year)
    }

    // Extract cardholder name (usually in CAPS)
    const nameMatch = text.match(/\n([A-Z\s]{5,})\n/)
    if (nameMatch) {
      setCardholderName(nameMatch[1].trim())
    }

    if (!cardNumberMatch && !expiryMatch && !nameMatch) {
      toast('Could not extract card details. Please check the image quality.', {
        icon: '⚠️'
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    if (cleanCardNumber.length !== 16) {
      toast.error('Card number must be 16 digits')
      return
    }
    if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      toast.error('Invalid expiry month')
      return
    }
    if (!expiryYear || expiryYear.length !== 4) {
      toast.error('Invalid expiry year')
      return
    }
    if (cvv.length < 3 || cvv.length > 4) {
      toast.error('CVV must be 3 or 4 digits')
      return
    }
    if (!cardholderName.trim()) {
      toast.error('Cardholder name is required')
      return
    }

    onSubmit({
      cardNumber: cleanCardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName: cardholderName.trim()
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-w-2xl mx-auto`}
    >
      <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Add Credit/Debit Card
      </h3>

      {/* Camera UI */}
      {showCamera && (
        <div className="mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-2xl"
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 rounded-xl"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className={`px-6 py-3 rounded-xl font-medium ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mb-6 relative">
          <img loading="lazy" src={capturedImage} alt="Captured card" className="w-full rounded-2xl" />
          <button
            type="button"
            onClick={() => setCapturedImage(null)}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* OCR Buttons */}
      {!showCamera && !capturedImage && (
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 rounded-xl hover:shadow-lg transition-shadow"
          >
            <CameraIcon className="h-5 w-5" />
            Scan Card with Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-colors ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Number */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-4 py-3 rounded-xl border text-lg font-mono tracking-wider ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            required
            disabled={isProcessing}
          />
        </div>

        {/* Expiry Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Expiry Month (MM)
            </label>
            <input
              type="text"
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="12"
              className={`w-full px-4 py-3 rounded-xl border text-lg font-mono ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              required
              disabled={isProcessing}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Expiry Year (YYYY)
            </label>
            <input
              type="text"
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="2025"
              className={`w-full px-4 py-3 rounded-xl border text-lg font-mono ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              required
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* CVV */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className={`w-full px-4 py-3 rounded-xl border text-lg font-mono ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            required
            disabled={isProcessing}
          />
        </div>

        {/* Cardholder Name */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            placeholder="JOHN DOE"
            className={`w-full px-4 py-3 rounded-xl border text-lg ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            required
            disabled={isProcessing}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 px-6 py-3 rounded-xl font-medium ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            } transition-colors`}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Add Card'}
          </button>
        </div>
      </form>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}
