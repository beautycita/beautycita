import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon,
  PaperClipIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

export interface DisputeTicket {
  id: string
  bookingId?: string
  bookingServiceName?: string
  bookingDate?: string
  type: 'booking_dispute' | 'payment_issue' | 'service_quality' | 'no_show' | 'cancellation' | 'refund' | 'general_support'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  subject: string
  description: string
  attachments: string[]
  messages: DisputeMessage[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  assignedAgent?: string
  refundAmount?: number
  compensationOffered?: {
    type: 'refund' | 'credit' | 'free_service'
    amount?: number
    description: string
  }
}

export interface DisputeMessage {
  id: string
  senderId: string
  senderName: string
  senderType: 'client' | 'agent' | 'system'
  content: string
  attachments: string[]
  timestamp: string
  isRead: boolean
}

interface CreateTicketProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bookingId?: string
}

const CreateTicket: React.FC<CreateTicketProps> = ({ isOpen, onClose, onSuccess, bookingId }) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [ticketData, setTicketData] = useState({
    type: 'general_support',
    subject: '',
    description: '',
    priority: 'medium'
  })
  const [attachments, setAttachments] = useState<File[]>([])

  const ticketTypes = [
    { value: 'booking_dispute', label: 'Disputa de Reserva', description: 'Problemas con una reserva específica' },
    { value: 'payment_issue', label: 'Problema de Pago', description: 'Cargos incorrectos o problemas de facturación' },
    { value: 'service_quality', label: 'Calidad del Servicio', description: 'El servicio no cumplió expectativas' },
    { value: 'no_show', label: 'No Presentación', description: 'El estilista no se presentó a la cita' },
    { value: 'cancellation', label: 'Cancelación', description: 'Problemas con cancelaciones' },
    { value: 'refund', label: 'Solicitud de Reembolso', description: 'Solicitar devolución de dinero' },
    { value: 'general_support', label: 'Soporte General', description: 'Otras consultas o problemas' }
  ]

  const priorityLevels = [
    { value: 'low', label: 'Baja', color: 'text-green-600' },
    { value: 'medium', label: 'Media', color: 'text-yellow-600' },
    { value: 'high', label: 'Alta', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-600' }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (attachments.length + files.length > 5) {
      toast.error('Máximo 5 archivos permitidos')
      return
    }
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketData.subject.trim() || !ticketData.description.trim()) {
      toast.error('Asunto y descripción son requeridos')
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post('/disputes/file', {
        booking_id: bookingId,
        type: ticketData.type,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority
      })

      if (response.success) {
        toast.success(t('disputes.success.create', 'Ticket creado exitosamente'))
        onSuccess()
        onClose()
      } else {
        toast.error(t('disputes.error.create', 'Error al crear ticket'))
      }
      setTicketData({ type: 'general_support', subject: '', description: '', priority: 'medium' })
      setAttachments([])
    } catch (error) {
      toast.error('Error al crear el ticket')
    } finally {
      setIsLoading(false)
    }
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
          className="relative bg-white rounded-full max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Crear Nuevo Ticket de Soporte
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Problema
              </label>
              <select
                value={ticketData.type}
                onChange={(e) => setTicketData({ ...ticketData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {ticketTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {ticketTypes.find(t => t.value === ticketData.type)?.description}
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={ticketData.priority}
                onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {priorityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto
              </label>
              <input
                type="text"
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                placeholder="Describe brevemente el problema"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada
              </label>
              <textarea
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Proporciona todos los detalles relevantes sobre el problema..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos Adjuntos (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-full p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center">
                    <PaperClipIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Haz clic para subir archivos o arrastra aquí
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC (máximo 5 archivos)
                    </p>
                  </div>
                </label>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-full">
                      <div className="flex items-center space-x-2">
                        <PaperClipIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking ID (if provided) */}
            {bookingId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-full">
                <p className="text-sm text-blue-700">
                  <strong>Reserva relacionada:</strong> {bookingId}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Crear Ticket'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

interface TicketDetailProps {
  ticket: DisputeTicket | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (ticketId: string) => void
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, isOpen, onClose, onUpdate }) => {
  const { t } = useTranslation()
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !ticket) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-blue-100 text-blue-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'high':
        return 'text-orange-600'
      case 'urgent':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsLoading(true)
    try {
      const response = await apiClient.post(`/disputes/${ticket.id}/respond`, {
        message: newMessage
      })

      if (response.success) {
        toast.success(t('disputes.success.message', 'Mensaje enviado'))
        setNewMessage('')
        onUpdate(ticket.id)
      } else {
        toast.error(t('disputes.error.message', 'Error al enviar mensaje'))
      }
    } catch (error) {
      toast.error('Error al enviar mensaje')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-full max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {ticket.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ticket #{ticket.id}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status === 'open' ? 'Abierto' :
                   ticket.status === 'in_progress' ? 'En Progreso' :
                   ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                </span>
                <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                  Prioridad {ticket.priority === 'low' ? 'Baja' :
                           ticket.priority === 'medium' ? 'Media' :
                           ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                </span>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Creado:</span>
                <span className="ml-2 text-gray-900">
                  {new Intl.DateTimeFormat('es-MX').format(new Date(ticket.createdAt))}
                </span>
              </div>
              {ticket.bookingId && (
                <div>
                  <span className="text-gray-500">Reserva:</span>
                  <span className="ml-2 text-gray-900">{ticket.bookingServiceName}</span>
                </div>
              )}
              {ticket.assignedAgent && (
                <div>
                  <span className="text-gray-500">Agente:</span>
                  <span className="ml-2 text-gray-900">{ticket.assignedAgent}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compensation Offered */}
          {ticket.compensationOffered && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-full">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">Compensación Ofrecida</h4>
              </div>
              <p className="text-sm text-green-700">
                {ticket.compensationOffered.description}
                {ticket.compensationOffered.amount && (
                  <span className="font-medium">
                    {' '}${ticket.compensationOffered.amount.toFixed(2)} MXN
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Conversación</h4>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {/* Initial Description */}
              <div className="p-3 bg-gray-50 rounded-full">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Tú</span>
                  <span className="text-xs text-gray-500">
                    {new Intl.DateTimeFormat('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    }).format(new Date(ticket.createdAt))}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{ticket.description}</p>
              </div>

              {/* Additional Messages */}
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-full ${
                    message.senderType === 'client' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.senderType === 'client' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      }).format(new Date(message.timestamp))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* New Message Form */}
          {ticket.status !== 'closed' && (
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 pt-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function DisputeTickets() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState<DisputeTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<DisputeTicket | null>(null)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/disputes/client')

      if (response.success && response.disputes) {
        setTickets(response.disputes)
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error(t('disputes.error.load', 'Error al cargar los tickets'))
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticket: DisputeTicket) => {
    setSelectedTicket(ticket)
    setShowDetailModal(true)
  }

  const handleUpdateTicket = (ticketId: string) => {
    // Reload ticket data
    loadTickets()
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true
    return ticket.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'in_progress':
        return <ClockIcon className="h-4 w-4" />
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'closed':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      'booking_dispute': 'Disputa de Reserva',
      'payment_issue': 'Problema de Pago',
      'service_quality': 'Calidad del Servicio',
      'no_show': 'No Presentación',
      'cancellation': 'Cancelación',
      'refund': 'Solicitud de Reembolso',
      'general_support': 'Soporte General'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-responsive py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Soporte y Disputas
          </h1>
          <p className="text-gray-600">
            Gestiona tus consultas y resuelve problemas con nuestro equipo de soporte
          </p>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2 rounded-full"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Crear Nuevo Ticket</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'open', label: 'Abiertos' },
              { key: 'in_progress', label: 'En Progreso' },
              { key: 'resolved', label: 'Resueltos' },
              { key: 'closed', label: 'Cerrados' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes tickets {filter === 'all' ? '' : filter}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all'
                    ? 'Crea un ticket si necesitas ayuda con algún problema'
                    : `No hay tickets ${filter} en este momento`
                  }
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary rounded-full"
                  >
                    Crear Primer Ticket
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                        <span className="text-xs text-gray-500">#{ticket.id}</span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{getTypeLabel(ticket.type)}</span>
                        {ticket.bookingServiceName && (
                          <>
                            <span>•</span>
                            <span>{ticket.bookingServiceName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Intl.DateTimeFormat('es-MX').format(new Date(ticket.createdAt))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(ticket.status)}
                        <span className="capitalize">
                          {ticket.status === 'open' ? 'Abierto' :
                           ticket.status === 'in_progress' ? 'En Progreso' :
                           ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="btn btn-secondary btn-sm flex items-center space-x-1 rounded-full"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>

                  {ticket.compensationOffered && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-full">
                      <p className="text-sm text-green-700">
                        <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                        Compensación ofrecida: {ticket.compensationOffered.description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTicket
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={loadTickets}
          />
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <TicketDetail
            ticket={selectedTicket}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onUpdate={handleUpdateTicket}
          />
        )}
      </AnimatePresence>
    </div>
  )
}