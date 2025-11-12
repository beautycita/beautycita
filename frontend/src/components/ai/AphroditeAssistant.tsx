import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CameraIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  HeartIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  FireIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AphroditeAssistantProps {
  isOpen: boolean
  onClose: () => void
  context?: string
  userType?: 'stylist' | 'client'
  initialQuery?: string
}

interface AphroditeSuggestion {
  id: string
  category: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: AphroditeSuggestion[]
}

const AphroditeAssistant: React.FC<AphroditeAssistantProps> = ({
  isOpen,
  onClose,
  context = 'general',
  userType = 'stylist',
  initialQuery = ''
}) => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialQuery)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const stylistSuggestions: AphroditeSuggestion[] = [
    {
      id: 'pricing-optimization',
      category: 'Precios',
      title: '¿Cómo optimizar mis precios?',
      description: 'Análisis de competencia y sugerencias de precios',
      icon: CurrencyDollarIcon,
      color: 'text-green-600'
    },
    {
      id: 'trend-analysis',
      category: 'Tendencias',
      title: '¿Qué tendencias están en auge?',
      description: 'Tendencias de belleza en tu área',
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600'
    },
    {
      id: 'client-retention',
      category: 'Clientes',
      title: '¿Cómo retener más clientes?',
      description: 'Estrategias de fidelización personalizadas',
      icon: HeartIcon,
      color: 'text-pink-600'
    },
    {
      id: 'portfolio-tips',
      category: 'Portfolio',
      title: '¿Cómo mejorar mi portfolio?',
      description: 'Tips para fotos que conviertan',
      icon: CameraIcon,
      color: 'text-blue-600'
    },
    {
      id: 'scheduling-optimization',
      category: 'Horarios',
      title: '¿Cómo optimizar mi calendario?',
      description: 'Maximiza tus ingresos con horarios inteligentes',
      icon: CalendarDaysIcon,
      color: 'text-orange-600'
    },
    {
      id: 'marketing-strategies',
      category: 'Marketing',
      title: '¿Cómo atraer más clientes?',
      description: 'Estrategias de marketing digital',
      icon: MegaphoneIcon,
      color: 'text-indigo-600'
    }
  ]

  const clientSuggestions: AphroditeSuggestion[] = [
    {
      id: 'style-recommendation',
      category: 'Estilo',
      title: '¿Qué estilo me queda mejor?',
      description: 'Recomendaciones personalizadas',
      icon: SparklesIcon,
      color: 'text-purple-600'
    },
    {
      id: 'trend-exploration',
      category: 'Tendencias',
      title: '¿Qué está de moda?',
      description: 'Las últimas tendencias en belleza',
      icon: FireIcon,
      color: 'text-orange-600'
    },
    {
      id: 'stylist-match',
      category: 'Estilistas',
      title: 'Encuentra mi estilista ideal',
      description: 'Match basado en tus preferencias',
      icon: UserGroupIcon,
      color: 'text-blue-600'
    },
    {
      id: 'maintenance-tips',
      category: 'Cuidado',
      title: 'Tips de mantenimiento',
      description: 'Cómo mantener tu look por más tiempo',
      icon: LightBulbIcon,
      color: 'text-yellow-600'
    }
  ]

  const suggestions = userType === 'stylist' ? stylistSuggestions : clientSuggestions

  useEffect(() => {
    if (isOpen) {
      // Initial welcome message
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: userType === 'stylist'
          ? `¡Hola! Soy Aphrodite, tu asistente de IA especializada en belleza. 💅✨\n\nEstoy aquí para ayudarte a hacer crecer tu negocio con insights basados en datos, tendencias del mercado y estrategias personalizadas.\n\n¿En qué puedo ayudarte hoy?`
          : `¡Hola! Soy Aphrodite, tu asistente de belleza personal. 💄✨\n\nPuedo ayudarte a encontrar el estilo perfecto, descubrir tendencias, y conectarte con los mejores estilistas.\n\n¿Qué te gustaría saber?`,
        timestamp: new Date(),
        suggestions: suggestions.slice(0, 4)
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, userType])

  const handleSendMessage = async (content: string = input) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(content, userType, context)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
  }

  const generateAIResponse = (query: string, userType: string, context: string): ChatMessage => {
    // Mock AI responses based on query patterns
    let responseContent = ''
    let relatedSuggestions: AphroditeSuggestion[] = []

    if (query.toLowerCase().includes('precio') || query.toLowerCase().includes('price')) {
      responseContent = `📊 **Análisis de Precios Personalizado**

Basándome en tu perfil y el mercado local:

**Tu posición actual:**
• Tus precios están 15% por encima del promedio de mercado
• Tu calificación de 4.8⭐ justifica precios premium
• Tasa de conversión del 32% (excelente)

**Recomendaciones:**
1. **Servicios con potencial de aumento (+20%):**
   • Coloración: $150 → $180
   • Tratamientos capilares: $80 → $96

2. **Estrategia de precios dinámicos:**
   • Viernes/Sábado: +15% (alta demanda)
   • Lunes-Miércoles: Precios regulares
   • Paquetes especiales: -10% en 3+ servicios

3. **Comparación con competencia:**
   • Tu rango: $80-150
   • Competencia promedio: $70-130
   • Premium local: $100-200

💡 **Acción inmediata:** Prueba aumentar gradualmente 10% este mes y mide la respuesta.`

      relatedSuggestions = suggestions.filter(s =>
        ['pricing-optimization', 'client-retention', 'marketing-strategies'].includes(s.id)
      )
    } else if (query.toLowerCase().includes('tendencia') || query.toLowerCase().includes('trend')) {
      responseContent = `🔥 **Tendencias Calientes en Tu Área**

**Top 3 Tendencias Este Mes:**

1. **Balayage Natural (+35% búsquedas)**
   • Técnica de bajo mantenimiento
   • Ideal para clima tropical
   • Precio sugerido: $180-220

2. **Cortes Bob Modernos (+22% demanda)**
   • Bob francés y wolf cut
   • Popular en 25-35 años
   • Precio sugerido: $80-120

3. **Tratamientos Orgánicos (+40% interés)**
   • Keratina vegana
   • Botox capilar natural
   • Precio sugerido: $150-200

**Oportunidades para ti:**
• Crea contenido de "antes y después" con estas tendencias
• Ofrece paquetes de introducción con 20% descuento
• Colabora con influencers locales

📈 **Predicción:** El balayage natural seguirá creciendo 3-4 meses más.`

      relatedSuggestions = suggestions.filter(s =>
        ['trend-analysis', 'portfolio-tips', 'marketing-strategies'].includes(s.id)
      )
    } else if (query.toLowerCase().includes('cliente') || query.toLowerCase().includes('retention')) {
      responseContent = `❤️ **Estrategia de Retención de Clientes**

**Tu situación actual:**
• Tasa de retención: 78% (buena)
• Objetivo recomendado: 85%
• Potencial de ingreso adicional: +$600/mes

**Plan de Acción Personalizado:**

1. **Programa de Fidelidad (Implementar esta semana)**
   • 5ta visita: 20% descuento
   • 10ma visita: Servicio gratis
   • Cumpleaños: 30% descuento

2. **Comunicación Proactiva**
   • WhatsApp recordatorios de mantenimiento (cada 6-8 semanas)
   • Tips de cuidado personalizados post-servicio
   • Fotos del resultado para compartir

3. **Experiencia VIP**
   • Bebida de bienvenida personalizada
   • Playlist Spotify según preferencias
   • Mini masaje de cuero cabelludo gratis

4. **Sistema de Referidos**
   • Cliente refiere = 15% descuento ambos
   • 3 referidos = Servicio gratis

🎯 **Meta mensual:** Recuperar 5 clientes inactivos + 10 nuevos referidos.`

      relatedSuggestions = suggestions.filter(s =>
        ['client-retention', 'marketing-strategies', 'scheduling-optimization'].includes(s.id)
      )
    } else {
      responseContent = `Entiendo tu consulta sobre "${query}". Déjame analizar la mejor manera de ayudarte...

Para darte la respuesta más precisa, ¿podrías especificar si te interesa más:
• Estrategias de negocio
• Tendencias y técnicas
• Marketing y promoción
• Gestión de clientes

Mientras tanto, aquí hay algunas sugerencias relevantes que podrían interesarte:`

      relatedSuggestions = suggestions.slice(0, 3)
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      suggestions: relatedSuggestions
    }
  }

  const handleSuggestionClick = (suggestion: AphroditeSuggestion) => {
    setSelectedSuggestion(suggestion.id)
    handleSendMessage(suggestion.title)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-3xl max-w-2xl w-full h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-white/20 rounded-3xl flex items-center justify-center"
                >
                  <SparklesIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold">Aphrodite IA</h3>
                  <p className="text-sm text-white/80">Tu asistente de belleza inteligente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md ${message.role === 'user' ? 'order-2' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl flex items-center justify-center">
                        <SparklesIcon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-500">Aphrodite</span>
                    </div>
                  )}

                  <div className={`rounded-full p-4 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 mb-2">Sugerencias relacionadas:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {message.suggestions.map((suggestion) => (
                          <motion.button
                            key={suggestion.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-left p-3 bg-white border border-gray-200 rounded-3xl hover:border-primary-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`${suggestion.color}`}>
                                <suggestion.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                                <p className="text-xs text-gray-500">{suggestion.description}</p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-3xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-3xl animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-3xl animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-3xl animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregúntame sobre tendencias, precios, marketing..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage()}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-3xl hover:from-primary-700 hover:to-purple-700 flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Enviar</span>
              </motion.button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-3xl text-xs hover:bg-gray-200 transition-colors"
                >
                  {suggestion.category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AphroditeAssistant