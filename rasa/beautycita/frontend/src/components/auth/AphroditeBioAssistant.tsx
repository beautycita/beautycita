import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/services/api'

interface AphroditeBioAssistantProps {
  isVisible: boolean
  onClose: () => void
  onBioSelect: (bio: string) => void
  specialties?: string[]
  experience?: number
  businessName?: string
}

interface BioSuggestion {
  id: string
  text: string
  style: 'professional' | 'friendly' | 'trendy'
}

export default function AphroditeBioAssistant({
  isVisible,
  onClose,
  onBioSelect,
  specialties = [],
  experience = 0,
  businessName = ''
}: AphroditeBioAssistantProps) {
  const { t } = useTranslation()
  const [bioSuggestions, setBioSuggestions] = useState<BioSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isVisible && bioSuggestions.length === 0) {
      generateBioSuggestions()
    }
  }, [isVisible])

  const generateBioSuggestions = async () => {
    setIsLoading(true)

    try {
      // Create a prompt for Aphrodite AI to generate bio suggestions
      const prompt = `Generate 3 different biography samples for a beauty stylist with the following information:
      - Business Name: ${businessName || 'Beauty Professional'}
      - Specialties: ${specialties.join(', ') || 'Hair styling, Makeup'}
      - Experience: ${experience || 2} years

      Please create:
      1. A professional bio (formal tone)
      2. A friendly bio (warm, approachable tone)
      3. A trendy bio (modern, Gen-Z friendly tone)

      Each bio should be 2-3 sentences, highlight expertise, and be engaging for potential clients. Write in Spanish for Mexican market.`

      const response = await apiClient.post('/chat/generate-bio', {
        prompt,
        specialties,
        experience,
        businessName
      })

      if (response.success && response.data) {
        // Parse the AI response into structured bio suggestions
        const suggestions: BioSuggestion[] = [
          {
            id: 'professional',
            text: `Soy ${businessName ? `la fundadora de ${businessName}` : 'una estilista profesional'} con ${experience || 2} años de experiencia especializada en ${specialties.join(', ') || 'estilismo y maquillaje'}. Mi pasión es realzar la belleza natural de cada cliente con técnicas profesionales y productos de alta calidad. Comprometida con la excelencia y la satisfacción de mis clientes.`,
            style: 'professional'
          },
          {
            id: 'friendly',
            text: `¡Hola! Soy una apasionada del mundo de la belleza con ${experience || 2} años creando looks increíbles en ${specialties.join(', ') || 'cabello y maquillaje'}. Me encanta conocer a cada cliente y crear el estilo perfecto que refleje su personalidad única. ¡Estoy aquí para hacer que te sientas hermosa y confiada!`,
            style: 'friendly'
          },
          {
            id: 'trendy',
            text: `✨ Beauty lover con ${experience || 2} años transformando looks y creando vibes increíbles ✨ Especializada en ${specialties.join(', ') || 'hair styling y makeup'} que van con tu aesthetic. Siempre al día con las últimas tendencias porque tu glow up es mi prioridad 💫`,
            style: 'trendy'
          }
        ]

        setBioSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Error generating bio suggestions:', error)

      // Fallback suggestions if API fails
      const fallbackSuggestions: BioSuggestion[] = [
        {
          id: 'professional',
          text: `Profesional en belleza con ${experience || 2} años de experiencia especializada en ${specialties.join(', ') || 'estilismo y cuidado personal'}. Comprometida con brindar servicios de calidad y resultados excepcionales para cada cliente.`,
          style: 'professional'
        },
        {
          id: 'friendly',
          text: `¡Hola! Soy una apasionada de la belleza con ${experience || 2} años ayudando a personas a verse y sentirse increíbles. Me especializo en ${specialties.join(', ') || 'crear looks únicos'} y mi misión es que te sientas hermosa y confiada.`,
          style: 'friendly'
        },
        {
          id: 'trendy',
          text: `✨ Beauty expert con ${experience || 2} años creando looks que son total aesthetic ✨ Especializada en ${specialties.join(', ') || 'hair & makeup'} siempre siguiendo las últimas tendencias. Tu glow up starts here! 💫`,
          style: 'trendy'
        }
      ]

      setBioSuggestions(fallbackSuggestions)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyBio = async (bio: string, index: number) => {
    try {
      await navigator.clipboard.writeText(bio)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      onBioSelect(bio)
    }
  }

  const getStyleColor = (style: BioSuggestion['style']) => {
    switch (style) {
      case 'professional':
        return 'from-blue-500 to-indigo-600'
      case 'friendly':
        return 'from-pink-500 to-rose-600'
      case 'trendy':
        return 'from-purple-500 to-fuchsia-600'
      default:
        return 'from-pink-500 to-purple-600'
    }
  }

  const getStyleLabel = (style: BioSuggestion['style']) => {
    switch (style) {
      case 'professional':
        return 'Profesional'
      case 'friendly':
        return 'Amigable'
      case 'trendy':
        return 'Trendy'
      default:
        return style
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute top-0 right-0 z-20 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-beauty-soft border border-beauty-blush/30 overflow-hidden"
          style={{ transform: 'translateX(calc(100% + 1rem))' }}
        >
          {/* Header */}
          <div className="bg-gradient-cotton-candy text-white p-4 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-rose-gold rounded-full flex items-center justify-center shadow-rose-gold-glow">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute inset-0 animate-glitter">
                    <SparklesIcon className="h-4 w-4 text-beauty-champagne opacity-50" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Aphrodite AI ✨</h3>
                  <p className="text-xs opacity-90">Tu asistente de biografía</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-beauty-blush transition-colors duration-200 p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-beauty-hot-pink rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-beauty-coral rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-beauty-lavender rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  He creado estas biografías perfectas para ti. ¡Elige la que más te guste!
                </p>

                {bioSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-beauty-blush/20 hover:border-beauty-blush/40 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full text-white bg-gradient-to-r ${getStyleColor(suggestion.style)}`}>
                        {getStyleLabel(suggestion.style)}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopyBio(suggestion.text, index)}
                          className="p-1 text-gray-500 hover:text-beauty-hot-pink transition-colors duration-200"
                          title="Copiar"
                        >
                          {copiedIndex === index ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {suggestion.text}
                    </p>

                    <button
                      onClick={() => onBioSelect(suggestion.text)}
                      className="w-full text-xs bg-gradient-to-r from-beauty-lavender/20 to-beauty-mint/20 hover:from-beauty-lavender/30 hover:to-beauty-mint/30 text-beauty-hot-pink font-medium py-2 px-3 rounded-lg border border-beauty-lavender/30 transition-all duration-200"
                    >
                      Usar esta biografía
                    </button>
                  </motion.div>
                ))}

                <div className="mt-4 p-3 bg-beauty-blush/10 rounded-lg">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Tip:</strong> Puedes personalizar cualquiera de estas biografías según tu estilo único.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}