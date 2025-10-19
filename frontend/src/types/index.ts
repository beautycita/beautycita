export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  // API returns snake_case, support both formats
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  role: 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN'
  emailVerified: boolean
  email_verified?: boolean
  isActive: boolean
  is_active?: boolean
  profileComplete?: boolean
  profile_complete?: boolean
  profilePictureUrl?: string
  profile_picture_url?: string
  createdAt: string
  created_at?: string
  lastLoginAt?: string
  last_login_at?: string
  provider?: string
  provider_id?: string
}

export interface Client {
  id: string
  userId: string
  preferences?: {
    favoriteServices?: string[]
    preferredStylists?: string[]
    communicationPreferences?: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  totalBookings: number
  averageRating?: number
}

export interface Stylist {
  id: string
  userId: string
  businessName: string
  bio?: string
  specialties: string[]
  experience: number
  isVerified: boolean
  isAcceptingBookings: boolean
  ratingAverage: number
  ratingCount: number
  totalBookings: number
  pricingTier: 'BUDGET' | 'MID_RANGE' | 'PREMIUM' | 'LUXURY'

  // Location
  locationAddress?: string
  locationCity?: string
  locationState?: string
  locationZipCode?: string
  locationCountry?: string
  latitude?: number
  longitude?: number

  // Business info
  instagramUrl?: string
  portfolioImages?: string[]
  availableHours?: {
    [key: string]: { start: string; end: string }[] // day of week -> time slots
  }

  verificationDate?: string
  user?: User
}

export interface ServiceCategory {
  id: string
  name: string
  nameEs: string
  description?: string
  descriptionEs?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  activeServicesCount?: number
}

export interface Service {
  id: string
  stylistId: string
  categoryId: string
  name: string
  nameEs: string
  description?: string
  descriptionEs?: string
  durationMinutes: number
  price: number
  isAddon: boolean
  requiresConsultation: boolean
  preparationTimeMinutes: number
  cleanupTimeMinutes: number
  isActive: boolean

  // Relations
  category?: ServiceCategory
  stylist?: Stylist
  totalBookings?: number
}

// Booking Status Types
export type BookingStatus =
  | 'PENDING_PAYMENT'        // Initial state, payment not completed
  | 'PENDING_STYLIST_APPROVAL' // Payment completed, waiting for stylist response (5 min)
  | 'STYLIST_ACCEPTED'       // Stylist accepted, waiting for client final confirmation
  | 'CLIENT_CONFIRMED'       // Client confirmed, booking is final
  | 'IN_PROGRESS'           // Service is happening
  | 'COMPLETED'             // Service finished successfully
  | 'STYLIST_DECLINED'      // Stylist declined the booking request
  | 'STYLIST_NO_RESPONSE'   // Stylist didn't respond within 5 minutes
  | 'CLIENT_NO_CONFIRM'     // Client didn't confirm after stylist acceptance
  | 'CLIENT_NO_SHOW'        // Client didn't show up for appointment
  | 'STYLIST_NO_SHOW'       // Stylist didn't show up for appointment
  | 'CANCELLED'             // Manually cancelled by either party
  | 'EXPIRED'               // Booking expired due to timeout

export type CreditType = 'PENDING' | 'AVAILABLE'

export type TransactionType =
  | 'BOOKING_PAYMENT'         // Payment received for completed booking
  | 'BOOKING_REFUND'         // Refund for failed/cancelled booking
  | 'NO_SHOW_PARTIAL_REFUND' // Partial refund when client doesn't show (60%)
  | 'NO_SHOW_COMPENSATION'   // Compensation when client doesn't show (40%)
  | 'STYLIST_NO_SHOW_REFUND' // Full refund when stylist doesn't show
  | 'WITHDRAWAL_REQUEST'     // Credit withdrawal request

export interface Booking {
  id: string
  clientId: string
  stylistId: string
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  status: BookingStatus
  totalPrice: number
  notes?: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentIntentId?: string
  cancellationReason?: string
  requestExpiresAt?: string  // When stylist response expires (5 min)
  acceptanceExpiresAt?: string // When final booking expires (15 min total)
  createdAt: string
  updatedAt: string

  // Relations
  client?: Client & { user?: User }
  stylist?: Stylist & { user?: User }
  service?: Service
}

// Credit System Types
export interface UserCredits {
  id: string
  userId: string
  pendingCredits: number
  availableCredits: number
  totalCredits: number
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: string
  userId: string
  bookingId?: string
  transactionType: TransactionType
  amount: number
  creditType: CreditType
  description: string
  referenceId?: string
  createdAt: string
}

export interface Payment {
  id: string
  bookingId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  paymentMethodId?: string
  stripeCustomerId?: string
  createdAt: string
  updatedAt: string

  // Relations
  booking?: Booking
}

export interface Review {
  id: string
  bookingId: string
  clientId: string
  stylistId: string
  rating: number
  comment?: string
  isAnonymous: boolean
  responseFromStylist?: string
  createdAt: string
  updatedAt: string

  // Relations
  client?: Client & { user?: User }
  stylist?: Stylist & { user?: User }
  booking?: Booking
  service?: Service
}

export interface ChatConversation {
  id: string
  userId?: string
  sessionId: string
  messageCount: number
  lastActivity: string
  createdAt: string
  lastMessage?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderType: 'USER' | 'BOT'
  messageText: string
  messageData?: any
  timestamp: string
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages?: number
    totalResults?: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
    hasMore?: boolean
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  countryCode?: string
  acceptTerms: boolean
}

export interface StylistRegisterForm extends RegisterForm {
  businessName: string
  bio?: string
  specialties: string[]
  experience: number
  locationAddress: string
  locationCity: string
  locationState: string
  latitude?: number
  longitude?: number
  instagramUrl?: string
  portfolioImages: File[]
}

export interface BookingForm {
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
}

export interface ReviewForm {
  rating: number
  comment?: string
  isAnonymous: boolean
}

// Search and filter types
export interface SearchFilters {
  category?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: 'price' | 'rating' | 'popularity'
  page?: number
  limit?: number
}

export interface StylistFilters {
  specialties?: string[]
  city?: string
  ratingMin?: number
  verified?: boolean
  acceptingBookings?: boolean
  sortBy?: 'rating' | 'popularity' | 'newest'
  page?: number
  limit?: number
}

// Store types
export interface AuthState {
  user: User | null
  client: Client | null
  stylist: Stylist | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export interface BookingState {
  currentBooking: Partial<Booking> | null
  selectedService: Service | null
  selectedStylist: Stylist | null
  availableSlots: string[]
  isLoading: boolean
}

// Chat types
export interface ChatState {
  isOpen: boolean
  conversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  action?: {
    label: string
    handler: () => void
  }
  createdAt: string
  read: boolean
}

// Error types
export interface ApiError {
  message: string
  code?: string
  field?: string
  details?: any
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Language types
export type Language = 'en' | 'es'

// File upload types
export interface FileUpload {
  file: File
  preview?: string
  progress?: number
  error?: string
}