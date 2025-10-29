/**
 * BeautyCita Mobile App - API Client
 *
 * Axios instance configured with:
 * - Base URL
 * - JWT authentication
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Error handling
 * - Request/response logging (dev mode)
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiError, ApiResponse} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = 'https://beautycita.com/api';
const TOKEN_KEY = '@beautycita:token';
const REFRESH_TOKEN_KEY = '@beautycita:refresh_token';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const __DEV__ = process.env.NODE_ENV !== 'production';

// ============================================================================
// Axios Instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================================
// Request Interceptor - Add JWT Token
// ============================================================================

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log request in dev mode
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('[API Request Data]', config.data);
      }
    }

    // Add JWT token to authorization header
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API Client] Failed to get token from AsyncStorage', error);
    }

    return config;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  },
);

// ============================================================================
// Response Interceptor - Handle Errors & Token Refresh
// ============================================================================

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token refresh completes
 */
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh the JWT token
 */
const refreshAuthToken = async (): Promise<string> => {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const {token: newToken, refreshToken: newRefreshToken} = response.data;

    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    return newToken;
  } catch (error) {
    // Clear tokens if refresh fails
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    throw error;
  }
};

apiClient.interceptors.response.use(
  response => {
    // Log response in dev mode
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Log error in dev mode
    if (__DEV__) {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Token refresh failed - user needs to login again
        return Promise.reject(createApiError(refreshError as AxiosError));
      }
    }

    // Handle network errors with retry logic
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error'
    ) {
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1;

        // Exponential backoff
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);

        if (__DEV__) {
          console.log(
            `[API Client] Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`,
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    // Handle 500+ server errors with retry
    if (error.response?.status && error.response.status >= 500) {
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1;
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);

        if (__DEV__) {
          console.log(
            `[API Client] Retrying request after server error (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`,
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(createApiError(error));
  },
);

// ============================================================================
// Error Handling Helper
// ============================================================================

/**
 * Create a standardized API error from an Axios error
 */
const createApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as any;
    return {
      message: data?.message || data?.error || error.message,
      status: error.response.status,
      code: data?.code,
      errors: data?.errors,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'No response from server. Please check your internet connection.',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  } else {
    // Error in request setup
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      code: 'REQUEST_ERROR',
    };
  }
};

// ============================================================================
// Helper Methods
// ============================================================================

/**
 * Get the current auth token from AsyncStorage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('[API Client] Failed to get auth token', error);
    return null;
  }
};

/**
 * Set the auth token in AsyncStorage
 */
export const setAuthToken = async (token: string, refreshToken?: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('[API Client] Failed to set auth token', error);
    throw error;
  }
};

/**
 * Clear auth tokens from AsyncStorage
 */
export const clearAuthTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('[API Client] Failed to clear auth tokens', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// ============================================================================
// Export
// ============================================================================

export default apiClient;
export {API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY};
export type {ApiError, ApiResponse};
