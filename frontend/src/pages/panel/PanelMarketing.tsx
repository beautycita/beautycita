import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  PhotoIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  TagIcon,
  ShareIcon,
  HashtagIcon,
  ArrowDownTrayIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  SwatchIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ChevronRightIcon,
  CreditCardIcon,
  GlobeAltIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import QRCodeGenerator from '../../components/marketing/QRCodeGenerator'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type ToolCategory = 'all' | 'social' | 'design' | 'promotions' | 'content' | 'ai'

interface Tool {
  id: string
  name: string
  description: string
  icon: any
  gradient: string
  category: ToolCategory
}

export default function PanelMarketing() {
  const { t } = useTranslation()
  const { token } = useAuthStore()
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // AI Content Generator
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiContentType, setAiContentType] = useState('instagram')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState('')

  // Promo Code Generator
  const [promoCode, setPromoCode] = useState('')
  const [promoAmount, setPromoAmount] = useState('20')
  const [promoType, setPromoType] = useState<'percentage' | 'fixed'>('percentage')
  const [promoExpiry, setPromoExpiry] = useState('')

  // Social Post Creator
  const [postPlatform, setPostPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram')
  const [postCaption, setPostCaption] = useState('')
  const [postHashtags, setPostHashtags] = useState<string[]>([])
  const [newHashtag, setNewHashtag] = useState('')

  // Banner Creator
  const [bannerTitle, setBannerTitle] = useState('SPECIAL OFFER')
  const [bannerSubtitle, setBannerSubtitle] = useState('Limited Time Only!')
  const [bannerColor, setBannerColor] = useState('#ec4899')
  const [bannerStyle, setBannerStyle] = useState<'modern' | 'elegant' | 'bold'>('modern')

  // Price List Generator
  const [priceListServices, setPriceListServices] = useState([
    { name: 'Haircut & Style', price: '50', duration: '60 min' },
    { name: 'Hair Coloring', price: '120', duration: '120 min' },
    { name: 'Manicure', price: '35', duration: '45 min' }
  ])

  // Email Template
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailTemplate, setEmailTemplate] = useState<'welcome' | 'promo' | 'reminder'>('promo')

  // SMS Campaign
  const [smsMessage, setSmsMessage] = useState('')
  const smsCharLimit = 160

  const tools: Tool[] = [
    {
      id: 'ai-content',
      name: t('marketing.tools.aiContent.name'),
      description: t('marketing.tools.aiContent.description'),
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      category: 'ai'
    },
    {
      id: 'social-post',
      name: t('marketing.tools.socialPost.name'),
      description: t('marketing.tools.socialPost.description'),
      icon: ShareIcon,
      gradient: 'from-blue-500 to-cyan-500',
      category: 'social'
    },
    {
      id: 'hashtag-generator',
      name: t('marketing.tools.hashtagGenerator.name'),
      description: t('marketing.tools.hashtagGenerator.description'),
      icon: HashtagIcon,
      gradient: 'from-indigo-500 to-purple-500',
      category: 'social'
    },
    {
      id: 'banner-creator',
      name: t('marketing.tools.bannerCreator.name'),
      description: t('marketing.tools.bannerCreator.description'),
      icon: PhotoIcon,
      gradient: 'from-pink-500 to-rose-500',
      category: 'design'
    },
    {
      id: 'price-list',
      name: t('marketing.tools.priceList.name'),
      description: t('marketing.tools.priceList.description'),
      icon: ClipboardDocumentListIcon,
      gradient: 'from-emerald-500 to-teal-500',
      category: 'design'
    },
    {
      id: 'promo-code',
      name: t('marketing.tools.promoCode.name'),
      description: t('marketing.tools.promoCode.description'),
      icon: TagIcon,
      gradient: 'from-amber-500 to-orange-500',
      category: 'promotions'
    },
    {
      id: 'coupon-designer',
      name: t('marketing.tools.digitalCoupon.name'),
      description: t('marketing.tools.digitalCoupon.description'),
      icon: CurrencyDollarIcon,
      gradient: 'from-yellow-500 to-amber-500',
      category: 'promotions'
    },
    {
      id: 'email-campaign',
      name: t('marketing.tools.emailCampaign.name'),
      description: t('marketing.tools.emailCampaign.description'),
      icon: EnvelopeIcon,
      gradient: 'from-violet-500 to-purple-500',
      category: 'content'
    },
    {
      id: 'sms-blast',
      name: t('marketing.tools.smsCampaign.name'),
      description: t('marketing.tools.smsCampaign.description'),
      icon: DevicePhoneMobileIcon,
      gradient: 'from-cyan-500 to-blue-500',
      category: 'content'
    },
    {
      id: 'qr-generator',
      name: t('marketing.tools.qrGenerator.name'),
      description: t('marketing.tools.qrGenerator.description'),
      icon: QrCodeIcon,
      gradient: 'from-green-500 to-emerald-500',
      category: 'design'
    },
    {
      id: 'color-palette',
      name: t('marketing.tools.colorPalette.name'),
      description: t('marketing.tools.colorPalette.description'),
      icon: SwatchIcon,
      gradient: 'from-fuchsia-500 to-pink-500',
      category: 'design'
    },
    {
      id: 'review-request',
      name: t('marketing.tools.reviewRequest.name'),
      description: t('marketing.tools.reviewRequest.description'),
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-orange-500 to-red-500',
      category: 'content'
    }
  ]

  const categories = [
    { id: 'all' as ToolCategory, name: t('marketing.categories.all'), icon: RocketLaunchIcon },
    { id: 'ai' as ToolCategory, name: t('marketing.categories.ai'), icon: SparklesIcon },
    { id: 'social' as ToolCategory, name: t('marketing.categories.social'), icon: ShareIcon },
    { id: 'design' as ToolCategory, name: t('marketing.categories.design'), icon: PaintBrushIcon },
    { id: 'promotions' as ToolCategory, name: t('marketing.categories.promotions'), icon: TagIcon },
    { id: 'content' as ToolCategory, name: t('marketing.categories.content'), icon: DocumentDuplicateIcon }
  ]

  const filteredTools = activeCategory === 'all'
    ? tools
    : tools.filter(tool => tool.category === activeCategory)

  const generateAIContent = async () => {
    if (!aiPrompt.trim()) {
      toast.error(t('marketing.tools.aiContent.promptError'))
      return
    }

    try {
      setAiGenerating(true)
      const response = await axios.post(
        `${API_URL}/api/admin/marketing/generate`,
        { type: aiContentType, prompt: aiPrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAiResult(response.data.content)
      toast.success(t('marketing.tools.aiContent.successMessage'))
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t('marketing.tools.aiContent.errorMessage')
      toast.error(errorMsg)
      // Fallback demo content if API fails
      setAiResult(`✨ Sample ${aiContentType} post:\n\n"Transform your look with BeautyCita! Book your next beauty appointment with our expert stylists. From haircuts to manicures, we've got you covered. 💅✨\n\n#BeautyCita #BeautyServices #GlamUp"`)
    } finally {
      setAiGenerating(false)
    }
  }

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'BC'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPromoCode(code)
    toast.success(t('marketing.tools.promoCode.generateSuccess'))
  }

  const addHashtag = () => {
    if (newHashtag && !postHashtags.includes(newHashtag)) {
      setPostHashtags([...postHashtags, newHashtag.replace('#', '')])
      setNewHashtag('')
    }
  }

  const suggestedHashtags = [
    'beautycita', 'beautyservices', 'salon', 'haircare', 'nailart',
    'makeup', 'skincare', 'beautytips', 'glam', 'selfcare',
    'beautyblogger', 'makeuptutorial', 'hairstyle', 'nailsofinstagram', 'beautygoals'
  ]

  const downloadBanner = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1200
    canvas.height = 630

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    if (bannerStyle === 'modern') {
      gradient.addColorStop(0, bannerColor)
      gradient.addColorStop(1, '#9333ea')
    } else if (bannerStyle === 'elegant') {
      gradient.addColorStop(0, '#1e293b')
      gradient.addColorStop(1, '#334155')
    } else {
      gradient.addColorStop(0, '#dc2626')
      gradient.addColorStop(1, '#ea580c')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add decorative circles
    ctx.globalAlpha = 0.1
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(1000, 100, 300, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(200, 500, 200, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Title
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.font = 'bold 90px Arial'
    ctx.fillText(bannerTitle, canvas.width / 2, canvas.height / 2 - 60)

    // Subtitle
    ctx.font = '45px Arial'
    ctx.fillText(bannerSubtitle, canvas.width / 2, canvas.height / 2 + 40)

    // Branding
    ctx.font = '30px Arial'
    ctx.fillText('BeautyCita.com', canvas.width / 2, canvas.height - 80)

    // Download
    const link = document.createElement('a')
    link.download = `beautycita-banner-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    toast.success(t('marketing.tools.bannerCreator.downloadSuccess'))
  }

  const downloadPriceList = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 600 + (priceListServices.length * 80)

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#fdf2f8')
    gradient.addColorStop(1, '#fae8ff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header
    ctx.fillStyle = '#9333ea'
    ctx.fillRect(0, 0, canvas.width, 150)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 50px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('OUR SERVICES', canvas.width / 2, 70)
    ctx.font = '25px Arial'
    ctx.fillText('BeautyCita Beauty Services', canvas.width / 2, 110)

    // Services
    let y = 220
    ctx.textAlign = 'left'
    priceListServices.forEach((service, index) => {
      // Service card
      ctx.fillStyle = 'white'
      ctx.fillRect(50, y, canvas.width - 100, 70)

      // Service name
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 28px Arial'
      ctx.fillText(service.name, 80, y + 30)

      // Duration
      ctx.fillStyle = '#6b7280'
      ctx.font = '22px Arial'
      ctx.fillText(service.duration, 80, y + 55)

      // Price
      ctx.fillStyle = '#9333ea'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`$${service.price}`, canvas.width - 80, y + 45)
      ctx.textAlign = 'left'

      y += 90
    })

    // Footer
    y += 30
    ctx.fillStyle = '#6b7280'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Book your appointment today!', canvas.width / 2, y)
    ctx.fillText('www.beautycita.com', canvas.width / 2, y + 30)

    // Download
    const link = document.createElement('a')
    link.download = `beautycita-pricelist-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    toast.success(t('marketing.tools.priceList.downloadSuccess'))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('marketing.copiedToClipboard'))
  }

  const renderToolContent = () => {
    switch (activeTool) {
      case 'ai-content':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                AI Content Writer
              </h2>
              <p className="text-gray-600">Let AI create engaging content for your beauty business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <select
                    value={aiContentType}
                    onChange={(e) => setAiContentType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="instagram">Instagram Post</option>
                    <option value="facebook">Facebook Post</option>
                    <option value="email">Email Newsletter</option>
                    <option value="sms">SMS Message</option>
                    <option value="ad">Advertisement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What should we write about?</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Example: Write a post about our new summer hair color collection featuring vibrant pastels and bold highlights..."
                  />
                </div>

                <button
                  onClick={generateAIContent}
                  disabled={aiGenerating}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Generated Content</h3>
                  {aiResult && (
                    <button
                      onClick={() => copyToClipboard(aiResult)}
                      className="px-3 py-1.5 bg-white rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Copy
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 min-h-[300px]">
                  {aiResult ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{aiResult}</p>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <SparklesIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>Your AI-generated content will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'social-post':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Social Media Post Creator
              </h2>
              <p className="text-gray-600">Create perfect posts for Instagram, Facebook, and Twitter</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  {(['instagram', 'facebook', 'twitter'] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setPostPlatform(platform)}
                      className={`flex-1 py-3 rounded-2xl font-medium transition-all ${
                        postPlatform === platform
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Caption
                    <span className="text-gray-400 ml-2">
                      ({postCaption.length} characters)
                    </span>
                  </label>
                  <textarea
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your post caption here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Hashtags</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add hashtag"
                    />
                    <button
                      onClick={addHashtag}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {postHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => setPostHashtags(postHashtags.filter(t => t !== tag))}
                          className="hover:text-blue-900"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <button
                    onClick={() => copyToClipboard(`${postCaption}\n\n${postHashtags.map(t => `#${t}`).join(' ')}`)}
                    className="px-3 py-1.5 bg-white rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="bg-white rounded-2xl p-4 min-h-[400px]">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <p className="font-semibold text-gray-900">BeautyCita</p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{postCaption || 'Your caption will appear here...'}</p>
                    {postHashtags.length > 0 && (
                      <p className="text-blue-600">
                        {postHashtags.map(t => `#${t}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'hashtag-generator':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Hashtag Generator
              </h2>
              <p className="text-gray-600">Discover trending hashtags for the beauty industry</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-indigo-600" />
                  Popular
                </h3>
                <div className="space-y-2">
                  {suggestedHashtags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => copyToClipboard(`#${tag}`)}
                      className="w-full text-left px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors group"
                    >
                      <span className="text-indigo-600 font-medium">#{tag}</span>
                      <DocumentDuplicateIcon className="w-4 h-4 inline ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                  Trending
                </h3>
                <div className="space-y-2">
                  {suggestedHashtags.slice(8, 15).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => copyToClipboard(`#${tag}`)}
                      className="w-full text-left px-4 py-2 rounded-xl hover:bg-purple-50 transition-colors group"
                    >
                      <span className="text-purple-600 font-medium">#{tag}</span>
                      <DocumentDuplicateIcon className="w-4 h-4 inline ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Copy Sets</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => copyToClipboard(suggestedHashtags.slice(0, 5).map(t => `#${t}`).join(' '))}
                    className="w-full px-4 py-3 bg-white rounded-2xl hover:shadow-md transition-all text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">Starter Pack (5)</p>
                    <p className="text-xs text-gray-500">Essential hashtags</p>
                  </button>
                  <button
                    onClick={() => copyToClipboard(suggestedHashtags.slice(0, 10).map(t => `#${t}`).join(' '))}
                    className="w-full px-4 py-3 bg-white rounded-2xl hover:shadow-md transition-all text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">Growth Pack (10)</p>
                    <p className="text-xs text-gray-500">Boost your reach</p>
                  </button>
                  <button
                    onClick={() => copyToClipboard(suggestedHashtags.map(t => `#${t}`).join(' '))}
                    className="w-full px-4 py-3 bg-white rounded-2xl hover:shadow-md transition-all text-left"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">Max Pack (15)</p>
                    <p className="text-xs text-gray-500">Maximum visibility</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'banner-creator':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Promo Banner Creator
              </h2>
              <p className="text-gray-600">Design professional promotional banners in seconds</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['modern', 'elegant', 'bold'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setBannerStyle(style)}
                        className={`py-3 rounded-2xl font-medium transition-all ${
                          bannerStyle === style
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="SPECIAL OFFER"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Limited Time Only!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex gap-3">
                    {['#ec4899', '#9333ea', '#3b82f6', '#10b981', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBannerColor(color)}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          bannerColor === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={downloadBanner}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download Banner (1200×630)
                </button>
              </div>

              <div className="bg-gray-100 rounded-3xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl relative"
                  style={{
                    background: bannerStyle === 'modern'
                      ? `linear-gradient(135deg, ${bannerColor}, #9333ea)`
                      : bannerStyle === 'elegant'
                      ? 'linear-gradient(135deg, #1e293b, #334155)'
                      : 'linear-gradient(135deg, #dc2626, #ea580c)',
                    aspectRatio: '1200/630',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem'
                  }}
                >
                  <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute bottom-8 left-8 w-24 h-24 bg-white/10 rounded-full" />
                  <h2 className="text-white text-5xl font-bold mb-4 text-center relative z-10">{bannerTitle}</h2>
                  <p className="text-white text-2xl text-center relative z-10">{bannerSubtitle}</p>
                  <p className="text-white/80 text-lg absolute bottom-6">BeautyCita.com</p>
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )

      case 'price-list':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Service Price List Generator
              </h2>
              <p className="text-gray-600">Create beautiful service menus to share with clients</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Your Services</h3>
                  <button
                    onClick={() => setPriceListServices([...priceListServices, { name: 'New Service', price: '0', duration: '30 min' }])}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Service
                  </button>
                </div>

                <div className="space-y-3">
                  {priceListServices.map((service, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const updated = [...priceListServices]
                          updated[index].name = e.target.value
                          setPriceListServices(updated)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                        placeholder="Service name"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={service.price}
                          onChange={(e) => {
                            const updated = [...priceListServices]
                            updated[index].price = e.target.value
                            setPriceListServices(updated)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Price"
                        />
                        <input
                          type="text"
                          value={service.duration}
                          onChange={(e) => {
                            const updated = [...priceListServices]
                            updated[index].duration = e.target.value
                            setPriceListServices(updated)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Duration"
                        />
                        <button
                          onClick={() => setPriceListServices(priceListServices.filter((_, i) => i !== index))}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={downloadPriceList}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download Price List
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">OUR SERVICES</h3>
                    <p className="text-purple-100">BeautyCita Beauty Services</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {priceListServices.map((service, index) => (
                      <div key={index} className="pb-4 border-b border-gray-200 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <span className="text-lg font-bold text-purple-600">${service.price}</span>
                        </div>
                        <p className="text-sm text-gray-500">{service.duration}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 pb-6 text-center text-sm text-gray-500">
                    <p>Book your appointment today!</p>
                    <p className="font-medium">www.beautycita.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'promo-code':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Promo Code Generator
              </h2>
              <p className="text-gray-600">Create unique discount codes instantly</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={promoAmount}
                      onChange={(e) => setPromoAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-16"
                      placeholder="20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                      <button
                        onClick={() => setPromoType('percentage')}
                        className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                          promoType === 'percentage' ? 'bg-amber-100 text-amber-700' : 'text-gray-400'
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setPromoType('fixed')}
                        className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                          promoType === 'fixed' ? 'bg-amber-100 text-amber-700' : 'text-gray-400'
                        }`}
                      >
                        $
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={promoExpiry}
                    onChange={(e) => setPromoExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={generatePromoCode}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Generate Code
                </button>

                {promoCode && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Share with customers:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(promoCode)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Copy Code
                      </button>
                      <button
                        onClick={() => copyToClipboard(`Use code ${promoCode} for ${promoAmount}${promoType === 'percentage' ? '%' : '$'} off!`)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShareIcon className="w-4 h-4" />
                        Copy Message
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 flex items-center justify-center">
                {promoCode ? (
                  <div className="bg-white rounded-3xl shadow-2xl p-8 w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
                      <TagIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">PROMO CODE</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4 tracking-wider">
                      {promoCode}
                    </p>
                    <div className="inline-block px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
                      <p className="text-2xl font-bold text-amber-900">
                        {promoAmount}{promoType === 'percentage' ? '%' : '$'} OFF
                      </p>
                    </div>
                    {promoExpiry && (
                      <p className="text-sm text-gray-500">
                        Valid until {new Date(promoExpiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-400">BeautyCita.com</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <TagIcon className="w-24 h-24 mx-auto mb-4" />
                    <p className="text-lg">Generate a promo code to see preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'email-campaign':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Email Campaign Builder
              </h2>
              <p className="text-gray-600">Create professional email campaigns</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['welcome', 'promo', 'reminder'] as const).map((template) => (
                      <button
                        key={template}
                        onClick={() => setEmailTemplate(template)}
                        className={`py-3 rounded-2xl font-medium transition-all ${
                          emailTemplate === template
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {template.charAt(0).toUpperCase() + template.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Write your email content..."
                  />
                </div>

                <button
                  onClick={() => copyToClipboard(`Subject: ${emailSubject}\n\n${emailBody}`)}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                  Copy Email Content
                </button>
              </div>

              <div className="bg-gray-100 rounded-3xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Email Preview</h3>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                    <p className="text-white font-semibold">BeautyCita</p>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs text-gray-400">SUBJECT</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {emailSubject || 'Your email subject will appear here'}
                      </p>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {emailBody || 'Your email content will appear here...'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 text-center">
                    <p className="text-xs text-gray-500">
                      BeautyCita Beauty Services Platform
                      <br />
                      <a href="#" className="text-purple-600 hover:underline">beautycita.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'sms-blast':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                SMS Campaign Builder
              </h2>
              <p className="text-gray-600">Create short, impactful text message campaigns</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <span className={`text-sm font-medium ${smsMessage.length > smsCharLimit ? 'text-red-600' : 'text-gray-500'}`}>
                      {smsMessage.length}/{smsCharLimit}
                    </span>
                  </div>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={6}
                    maxLength={smsCharLimit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Your SMS message here..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Keep it short and include a clear call-to-action
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Quick Templates:</p>
                  <button
                    onClick={() => setSmsMessage('Limited time offer! Book now and get 20% off your next service at BeautyCita. Use code SAVE20. Reply STOP to opt out.')}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                  >
                    Promotional offer template
                  </button>
                  <button
                    onClick={() => setSmsMessage('Reminder: Your appointment with [Stylist] is tomorrow at [Time]. See you soon! - BeautyCita')}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                  >
                    Appointment reminder template
                  </button>
                  <button
                    onClick={() => setSmsMessage('Thank you for choosing BeautyCita! We\'d love your feedback. Rate your experience: [link]')}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                  >
                    Review request template
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(smsMessage)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                  Copy Message
                </button>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">BeautyCita</p>
                        <p className="text-cyan-100 text-xs">SMS Campaign</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-100 rounded-2xl p-4 min-h-[200px]">
                        {smsMessage ? (
                          <p className="text-gray-900 text-sm">{smsMessage}</p>
                        ) : (
                          <p className="text-gray-400 text-sm">Your SMS message will appear here...</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">
                        Preview - Message appearance may vary by device
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'qr-generator':
        return <QRCodeGenerator />

      case 'color-palette':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Brand Color Palette
              </h2>
              <p className="text-gray-600">Professional color schemes for your brand</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Beauty Pink', colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'] },
                { name: 'Royal Purple', colors: ['#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'] },
                { name: 'Ocean Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
                { name: 'Emerald Green', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'] },
                { name: 'Sunset Orange', colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'] },
                { name: 'Elegant Black', colors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'] }
              ].map((palette) => (
                <div key={palette.name} className="bg-white rounded-3xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">{palette.name}</h3>
                  <div className="space-y-2">
                    {palette.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => copyToClipboard(color)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div
                          className="w-12 h-12 rounded-lg shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-mono text-sm text-gray-600 group-hover:text-gray-900">
                          {color}
                        </span>
                        <DocumentDuplicateIcon className="w-4 h-4 ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'review-request':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Review Request Generator
              </h2>
              <p className="text-gray-600">Auto-generate review request messages</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'SMS Review Request',
                  message: 'Hi [Name]! Thanks for visiting BeautyCita. We\'d love to hear about your experience! Please take a moment to leave us a review: [ReviewLink] ⭐',
                  icon: DevicePhoneMobileIcon,
                  gradient: 'from-orange-500 to-red-500'
                },
                {
                  title: 'Email Review Request',
                  message: 'Dear [Name],\n\nThank you for choosing BeautyCita for your beauty needs! We hope you loved your recent [Service] with [Stylist].\n\nYour feedback helps us improve and helps others find great beauty services. Would you mind taking 2 minutes to share your experience?\n\n[Leave a Review Button]\n\nBest regards,\nThe BeautyCita Team',
                  icon: EnvelopeIcon,
                  gradient: 'from-red-500 to-pink-500'
                },
                {
                  title: 'Social Media Request',
                  message: '✨ Had an amazing experience at BeautyCita? We\'d love for you to share it! Tag us @beautycita and use #BeautyCitaGlow to be featured on our page! 💕',
                  icon: ShareIcon,
                  gradient: 'from-pink-500 to-fuchsia-500'
                },
                {
                  title: 'Follow-up Message',
                  message: 'Hi [Name]! Just checking in - how are you loving your new [Service]? If you\'re happy with the results, we\'d greatly appreciate a quick review! It means the world to us and [Stylist]. Thanks for being awesome! 🌟',
                  icon: ChatBubbleLeftRightIcon,
                  gradient: 'from-amber-500 to-orange-500'
                }
              ].map((template) => {
                const Icon = template.icon
                return (
                  <div key={template.title} className="bg-white rounded-3xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${template.gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{template.title}</h3>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 min-h-[150px]">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.message}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(template.message)}
                      className={`w-full py-2 bg-gradient-to-r ${template.gradient} text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Copy Template
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="mb-6">
            <button
              onClick={() => setActiveTool(null)}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Tools</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            {renderToolContent()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/panel" className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t('marketing.title')}
              </h1>
              <p className="mt-2 text-gray-600">{t('marketing.subtitle')}</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-3xl shadow-lg p-4">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const Icon = category.icon
                const isActive = activeCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const Icon = tool.icon
              return (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setActiveTool(tool.id)}
                  className="group bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  <div className="flex items-center text-purple-600 font-medium">
                    <span>Open Tool</span>
                    <ChevronRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
