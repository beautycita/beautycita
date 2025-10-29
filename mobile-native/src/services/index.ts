/**
 * BeautyCita Mobile App - Services Index
 *
 * Central export for all API services
 */

// Legacy API service (if still needed)
export {apiService} from './api';

// Core services
export {default as apiClient, getAuthToken, setAuthToken, clearAuthTokens, isAuthenticated} from './apiClient';
export {default as authService} from './authService';
export {default as userService} from './userService';
export {default as bookingService} from './bookingService';
export {default as stylistService} from './stylistService';
export {default as serviceService} from './serviceService';
export {default as paymentService} from './paymentService';
export {default as socketService} from './socketService';
export {default as notificationService, OneSignalLogLevel} from './notificationService';
export {default as reviewService} from './reviewService';

// Re-export types
export * from '../types';
