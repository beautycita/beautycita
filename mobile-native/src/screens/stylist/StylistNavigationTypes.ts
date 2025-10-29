/**
 * Stylist Navigation Types
 * TypeScript type definitions for React Navigation params
 */

import { ServiceCategory } from '../../types';

/**
 * Stylist Stack Navigation Parameter List
 */
export type StylistStackParamList = {
  // Dashboard & Schedule
  StylistDashboard: undefined;
  TodaySchedule: undefined;
  Calendar: undefined;

  // Booking Management
  BookingRequests: undefined;
  AcceptReject: {
    bookingId: number;
    action?: 'accept' | 'decline';
  };
  BookingDetailStylist: {
    bookingId: number;
  };
  MarkComplete: {
    bookingId: number;
  };

  // Communication
  ChatWithClient: {
    bookingId: number;
    clientId?: number;
  };

  // Service Management
  MyServices: undefined;
  AddService: undefined;
  EditService: {
    serviceId: number;
  };
  ServiceCategories: {
    onSelect: (category: ServiceCategory) => void;
  };
  PricingCalculator: {
    onPriceCalculated?: (price: number) => void;
  };

  // Availability
  AvailabilitySettings: undefined;
  SetWeeklyHours: undefined;
  BlockDates: undefined;

  // Reviews
  MyReviewsStylist: undefined;
  RespondToReview: {
    reviewId: number;
  };

  // Revenue & Payments
  RevenueDashboard: undefined;
  RevenueChart: {
    period?: 'week' | 'month' | 'year';
  };
  PayoutHistory: undefined;
  StripeConnectSetup: undefined;
  StripeDashboard: undefined;

  // Portfolio
  MyPortfolio: undefined;
  AddPortfolioPhoto: undefined;
  EditPortfolio: {
    photoId: string;
    photoUrl: string;
  };

  // Profile & Settings
  StylistProfile: undefined;
  EditStylistProfile: undefined;
  BusinessSettings: undefined;
  ServiceAreaMap: {
    currentLatitude?: number;
    currentLongitude?: number;
    currentRadius?: number;
  };

  // Client Management
  ClientManagement: undefined;
  ClientDetail: {
    clientId: number;
  };
  ClientHistory: {
    clientId: number;
  };

  // Notifications & Settings
  NotificationsStylist: undefined;
  SettingsStylist: undefined;
};

/**
 * Screen name constants for type-safe navigation
 */
export const StylistScreens = {
  DASHBOARD: 'StylistDashboard' as const,
  TODAY_SCHEDULE: 'TodaySchedule' as const,
  CALENDAR: 'Calendar' as const,
  BOOKING_REQUESTS: 'BookingRequests' as const,
  ACCEPT_REJECT: 'AcceptReject' as const,
  BOOKING_DETAIL: 'BookingDetailStylist' as const,
  MARK_COMPLETE: 'MarkComplete' as const,
  CHAT_WITH_CLIENT: 'ChatWithClient' as const,
  MY_SERVICES: 'MyServices' as const,
  ADD_SERVICE: 'AddService' as const,
  EDIT_SERVICE: 'EditService' as const,
  SERVICE_CATEGORIES: 'ServiceCategories' as const,
  PRICING_CALCULATOR: 'PricingCalculator' as const,
  AVAILABILITY_SETTINGS: 'AvailabilitySettings' as const,
  SET_WEEKLY_HOURS: 'SetWeeklyHours' as const,
  BLOCK_DATES: 'BlockDates' as const,
  MY_REVIEWS: 'MyReviewsStylist' as const,
  RESPOND_TO_REVIEW: 'RespondToReview' as const,
  REVENUE_DASHBOARD: 'RevenueDashboard' as const,
  REVENUE_CHART: 'RevenueChart' as const,
  PAYOUT_HISTORY: 'PayoutHistory' as const,
  STRIPE_CONNECT_SETUP: 'StripeConnectSetup' as const,
  STRIPE_DASHBOARD: 'StripeDashboard' as const,
  MY_PORTFOLIO: 'MyPortfolio' as const,
  ADD_PORTFOLIO_PHOTO: 'AddPortfolioPhoto' as const,
  EDIT_PORTFOLIO: 'EditPortfolio' as const,
  STYLIST_PROFILE: 'StylistProfile' as const,
  EDIT_STYLIST_PROFILE: 'EditStylistProfile' as const,
  BUSINESS_SETTINGS: 'BusinessSettings' as const,
  SERVICE_AREA_MAP: 'ServiceAreaMap' as const,
  CLIENT_MANAGEMENT: 'ClientManagement' as const,
  CLIENT_DETAIL: 'ClientDetail' as const,
  CLIENT_HISTORY: 'ClientHistory' as const,
  NOTIFICATIONS: 'NotificationsStylist' as const,
  SETTINGS: 'SettingsStylist' as const,
};

export default StylistStackParamList;
