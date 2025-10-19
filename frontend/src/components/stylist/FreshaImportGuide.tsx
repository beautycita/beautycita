import { useState } from 'react'
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface FreshaImportGuideProps {
  onComplete: (data: any) => void
  onClose: () => void
}

export default function FreshaImportGuide({ onComplete, onClose }: FreshaImportGuideProps) {
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    businessName: '',
    bio: '',
    phone: '',
    instagram: '',
    facebook: '',
    website: ''
  })

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (value && !copiedFields.has(field)) {
      setCopiedFields(prev => new Set([...prev, field]))
    }
  }

  const handleComplete = () => {
    if (!formData.businessName || !formData.bio) {
      toast.error('Please fill in at least Business Name and Bio')
      return
    }

    onComplete(formData)
    toast.success('Information imported successfully!')
    onClose()
  }

  const openFresha = () => {
    window.open('https://www.fresha.com/', '_blank')
  }

  const fields = [
    { id: 'businessName', label: 'Business Name', placeholder: 'Copy your business/salon name', required: true },
    { id: 'bio', label: 'Bio', placeholder: 'Copy your bio/description', required: true, multiline: true },
    { id: 'phone', label: 'Phone', placeholder: 'Copy your phone number', required: false },
    { id: 'instagram', label: 'Instagram', placeholder: 'Copy your Instagram handle', required: false },
    { id: 'facebook', label: 'Facebook', placeholder: 'Copy your Facebook page URL', required: false },
    { id: 'website', label: 'Website', placeholder: 'Copy your website URL', required: false }
  ]

  const progress = (copiedFields.size / fields.length) * 100

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <GlobeAltIcon className="w-6 h-6 text-purple-600" />
          Step-by-Step Guide
        </h3>

        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <p className="font-medium text-gray-900">Open your Fresha profile</p>
              <button
                onClick={openFresha}
                className="mt-2 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Open Fresha in new tab
              </button>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <p className="text-gray-700">Log in and navigate to your profile/business page</p>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <p className="text-gray-700">Copy and paste each field from your Fresha profile into the form below</p>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <p className="text-gray-700">Click "Complete Import" when done</p>
          </li>
        </ol>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Import Progress</span>
          <span className="text-sm text-gray-600">{copiedFields.size} of {fields.length} fields</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Copy Your Information:</h4>

        {fields.map(field => (
          <div key={field.id} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
              {copiedFields.has(field.id) && (
                <CheckCircleIcon className="inline-block w-5 h-5 text-green-500 ml-2" />
              )}
            </label>

            {field.multiline ? (
              <textarea
                value={formData[field.id as keyof typeof formData]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                placeholder={field.placeholder}
              />
            ) : (
              <div className="relative">
                <ClipboardDocumentIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData[field.id as keyof typeof formData]}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                  placeholder={field.placeholder}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleComplete}
          disabled={!formData.businessName || !formData.bio}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <CheckCircleIcon className="w-5 h-5" />
          Complete Import ({copiedFields.size}/{fields.length})
        </button>
      </div>
    </div>
  )
}
