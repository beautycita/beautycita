/**
 * Navigation Type Definitions
 * TypeScript types for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

/**
 * Root Stack (Main App Navigator)
 */
export type RootStackParamList = {
  Splash: undefined;
  Public: NavigatorScreenParams<PublicStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ClientApp: NavigatorScreenParams<ClientTabParamList>;
  StylistApp: NavigatorScreenParams<StylistTabParamList>;
  BusinessApp: NavigatorScreenParams<BusinessTabParamList>;
  AdminApp: NavigatorScreenParams<AdminTabParamList>;
};

/**
 * Public Stack (Non-authenticated users)
 */
export type PublicStackParamList = {
  Landing: undefined;
  About: undefined;
  HowItWorks: undefined;
  FAQ: undefined;
  Contact: undefined;
  Terms: undefined;
  Privacy: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: { role?: 'CLIENT' | 'STYLIST' } | undefined;
  PhoneVerification: { phone: string };
  BiometricSetup: undefined;
  ForgotPassword: undefined;
};

/**
 * Auth Stack (Login, Register, etc.)
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  PhoneVerification: { phone: string };
  BiometricSetup: undefined;
};

/**
 * Client Tab Navigator
 */
export type ClientTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

/**
 * Client Stack (Screens within Home tab)
 */
export type ClientStackParamList = {
  ClientHome: undefined;
  StylistProfile: { stylistId: number };
  ServiceDetails: { serviceId: number };
  BookingFlow: { serviceId: number; stylistId: number };
  BookingConfirmation: { bookingId: number };
  PaymentMethod: undefined;
  BookingDetails: { bookingId: number };
  ReviewStylist: { bookingId: number; stylistId: number };
  FavoritesScreen: undefined;
};

/**
 * Stylist Tab Navigator
 */
export type StylistTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Services: undefined;
  Messages: undefined;
  Profile: undefined;
};

/**
 * Stylist Stack (Screens within Dashboard)
 */
export type StylistStackParamList = {
  StylistDashboard: undefined;
  BookingDetails: { bookingId: number };
  ClientProfile: { clientId: number };
  ServiceManagement: undefined;
  AddService: undefined;
  EditService: { serviceId: number };
  Portfolio: undefined;
  UploadPortfolio: undefined;
  Revenue: undefined;
  Availability: undefined;
  Reviews: undefined;
};

/**
 * Business Tab Navigator (for Stylist business management)
 */
export type BusinessTabParamList = {
  Overview: undefined;
  Analytics: undefined;
  Revenue: undefined;
  Settings: undefined;
};

/**
 * Admin Tab Navigator
 */
export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Bookings: undefined;
  Payments: undefined;
  Reports: undefined;
  Settings: undefined;
};

/**
 * Admin Stack
 */
export type AdminStackParamList = {
  AdminDashboard: undefined;
  UserManagement: undefined;
  UserDetails: { userId: number };
  BookingManagement: undefined;
  PaymentManagement: undefined;
  DisputeManagement: undefined;
  DisputeDetails: { disputeId: string };
  SystemSettings: undefined;
  PlatformSettings: undefined;
  ContentModeration: undefined;
};

/**
 * Profile Stack (shared across all user types)
 */
export type ProfileStackParamList = {
  ProfileView: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  SMSPreferences: undefined;
  PrivacySettings: undefined;
  HelpSupport: undefined;
  AboutApp: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

/**
 * Navigation Props (for use in screens)
 */
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type ClientTabNavigationProp = BottomTabNavigationProp<ClientTabParamList>;
export type StylistTabNavigationProp = BottomTabNavigationProp<StylistTabParamList>;
export type BusinessTabNavigationProp = BottomTabNavigationProp<BusinessTabParamList>;
export type AdminTabNavigationProp = BottomTabNavigationProp<AdminTabParamList>;
