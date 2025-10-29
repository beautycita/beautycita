/**
 * BeautyCita Mobile App - TypeScript Type Definitions
 *
 * Matches backend API response types from beautycita.com API
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole = 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: number;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  role: UserRole;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  stylist?: Stylist;
  client?: Client;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  name?: string;
  business_name?: string;
}

// ============================================================================
// Client Types
// ============================================================================

export interface Client {
  id: number;
  user_id: number;
  name: string;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

// ============================================================================
// Stylist Types
// ============================================================================

export interface Stylist {
  id: number;
  user_id: number;
  business_name: string;
  bio: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  has_active_dispute: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  rating?: number;
  review_count?: number;
  distance?: number;
  portfolio_images?: string[];
  // Relations
  user?: User;
  services?: Service[];
  reviews?: Review[];
}

export interface StylistSearchFilters {
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  service_category?: string;
  min_rating?: number;
  max_price?: number;
  available_on?: string; // ISO date
  search?: string; // business name search
}

// ============================================================================
// Service Types
// ============================================================================

export type ServiceCategory =
  | 'HAIR'
  | 'NAILS'
  | 'MAKEUP'
  | 'SKINCARE'
  | 'MASSAGE'
  | 'WAXING'
  | 'OTHER';

export type PriceType = 'FIXED' | 'STARTING_AT' | 'HOURLY';

export interface Service {
  id: number;
  stylist_id: number;
  name: string;
  description: string | null;
  category: ServiceCategory;
  duration_minutes: number;
  price: number;
  price_type: PriceType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  stylist?: Stylist;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  category: ServiceCategory;
  duration_minutes: number;
  price: number;
  price_type?: PriceType;
  is_active?: boolean;
}

// ============================================================================
// Booking Types
// ============================================================================

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface Booking {
  id: number;
  client_id: number;
  stylist_id: number;
  service_id: number;
  booking_date: string; // ISO date
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  stylist?: Stylist;
  service?: Service;
  payments?: Payment[];
  // Location tracking
  client_latitude?: number;
  client_longitude?: number;
  proximity_alert_sent?: boolean;
}

export interface CreateBookingData {
  stylist_id: number;
  service_id: number;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  notes?: string;
}

export interface TimeSlot {
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  available: boolean;
}

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentMethod = 'CARD' | 'CASH' | 'OTHER';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  stripe_payment_intent_id: string | null;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  // Relations
  booking?: Booking;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentMethodData {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: number;
  booking_id: number;
  stylist_id: number;
  client_id: number;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  stylist?: Stylist;
  booking?: Booking;
}

export interface CreateReviewData {
  booking_id: number;
  rating: number;
  comment?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardData {
  upcoming_bookings: Booking[];
  total_bookings_this_month: number;
  total_revenue_this_month: number;
  average_rating: number;
  total_reviews: number;
  pending_bookings: number;
  completed_bookings_this_week: number;
}

export interface RevenueData {
  period: 'week' | 'month' | 'year';
  total_revenue: number;
  booking_count: number;
  average_booking_value: number;
  revenue_by_service: Array<{
    service_name: string;
    revenue: number;
    count: number;
  }>;
  daily_revenue?: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PROXIMITY_ALERT'
  | 'PAYMENT_RECEIVED'
  | 'REMINDER'
  | 'MESSAGE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// ============================================================================
// Socket Events
// ============================================================================

export interface SocketMessage {
  booking_id: number;
  sender_id: number;
  message: string;
  timestamp: string;
}

export interface SocketBookingUpdate {
  booking_id: number;
  status: BookingStatus;
  payment_status?: PaymentStatus;
  updated_at: string;
}

export interface SocketProximityAlert {
  booking_id: number;
  distance_miles: number;
  eta_minutes: number;
  message: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// SMS Preferences
// ============================================================================

export interface SmsPreferences {
  id: number;
  user_id: number;
  booking_requests: boolean;
  booking_confirmations: boolean;
  proximity_alerts: boolean;
  payment_notifications: boolean;
  reminders: boolean;
  cancellations: boolean;
  marketing: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Location Types
// ============================================================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  street?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

// ============================================================================
// Profile Update Types
// ============================================================================

export interface UpdateClientProfileData {
  name?: string;
  preferences?: Record<string, any>;
}

export interface UpdateStylistProfileData {
  business_name?: string;
  bio?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
}
