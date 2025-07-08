/**
 * API Service Layer
 * Centralized service for all API calls with authentication, error handling, and retry logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import envConfig, { getApiUrl, shouldLogApi } from '../config/environment';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  retries?: number;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = envConfig.API_BASE_URL;
    this.loadTokens();

    // TEMPORARY: Set a hardcoded token for testing
    this.authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzIiwiZW1haWwiOiI5MDAzNTE5NDk3c0BnbWFpbC5jb20iLCJpYXQiOjE3NDkxMjg4NDYsImV4cCI6MTc0OTczMzY0Nn0.fhGIHQ9ItrHF39fXQxmLEuioUZ_MYePHkR1vFyLYbrE";

    if (shouldLogApi()) {
      console.log('🌐 ApiService initialized with baseURL:', this.baseURL);
      console.log('🔧 Environment API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set');
      console.log('🔧 All environment variables:', {
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      });
      console.log('🔑 Using hardcoded token for testing');
    }
  }

  /**
   * Load authentication tokens from storage
   */
  private async loadTokens(): Promise<void> {
    try {
      const [token, refresh] = await Promise.all([
        AsyncStorage.getItem(envConfig.TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(envConfig.REFRESH_TOKEN_KEY),
      ]);

      this.authToken = token;
      this.refreshToken = refresh;

      if (shouldLogApi()) {
        console.log('🔑 Tokens loaded:', {
          hasToken: !!this.authToken,
          hasRefresh: !!this.refreshToken
        });
      }
    } catch (error) {
      console.error('❌ Failed to load tokens:', error);
    }
  }

  /**
   * Save authentication tokens to storage
   */
  private async saveTokens(token: string, refreshToken?: string): Promise<void> {
    try {
      this.authToken = token;
      await AsyncStorage.setItem(envConfig.TOKEN_STORAGE_KEY, token);

      if (refreshToken) {
        this.refreshToken = refreshToken;
        await AsyncStorage.setItem(envConfig.REFRESH_TOKEN_KEY, refreshToken);
      }

      if (shouldLogApi()) {
        console.log('💾 Tokens saved successfully');
      }
    } catch (error) {
      console.error('❌ Failed to save tokens:', error);
    }
  }

  /**
   * Clear authentication tokens
   */
  public async clearTokens(): Promise<void> {
    try {
      this.authToken = null;
      this.refreshToken = null;

      await Promise.all([
        AsyncStorage.removeItem(envConfig.TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(envConfig.REFRESH_TOKEN_KEY),
      ]);

      if (shouldLogApi()) {
        console.log('🗑️ Tokens cleared');
      }
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  /**
   * Get current authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, string | number>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    return searchParams.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Log API request/response for debugging
   */
  private logRequest(config: RequestConfig, response?: any, error?: any): void {
    if (!shouldLogApi()) return;

    const url = getApiUrl(config.endpoint);
    const timestamp = new Date().toISOString();

    console.log(`📡 [${timestamp}] ${config.method} ${url}`);
    console.log(`🔑 Auth Token: ${this.authToken ? 'Present' : 'Missing'}`);
    console.log(`🌐 Base URL: ${this.baseURL}`);
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'unknown'}`);

    if (config.data) {
      console.log('📤 Request Data:', config.data);
    }

    if (response) {
      console.log('📥 Response:', response);
    }

    if (error) {
      console.error('❌ Error:', error);
      console.error('❌ Error Details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        stack: error.stack
      });
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, config: RequestConfig): ApiError {
    let message = 'An unexpected error occurred';
    let status = 0;
    let code = 'UNKNOWN_ERROR';

    if (shouldLogApi()) {
      console.log('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: getApiUrl(config.endpoint),
      });
    }

    if (error.name === 'AbortError') {
      message = 'Request timeout. Please check your connection.';
      code = 'TIMEOUT_ERROR';
    } else if (error.response) {
      // Server responded with error status
      status = error.response.status;
      
      // Handle specific HTTP status codes
      if (status === 403) {
        message = 'Access Denied - You don\'t have permission to perform this action';
        code = 'FORBIDDEN';
      } else if (status === 401) {
        message = 'Unauthorized - Please log in again';
        code = 'UNAUTHORIZED';
      } else {
        message = error.response.data?.message || error.response.statusText || message;
        code = error.response.data?.code || `HTTP_${status}`;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection.';
      code = 'NETWORK_ERROR';
    } else if (error.message?.includes('Network request failed')) {
      // React Native specific network error
      message = 'Cannot connect to server. Please check if the backend is running and accessible.';
      code = 'CONNECTION_ERROR';
    } else {
      // Other error
      message = error.message || message;
      code = 'REQUEST_ERROR';
    }

    this.logRequest(config, null, { message, status, code });

    return { message, status, code };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, endpoint, data, params, headers = {}, requiresAuth = true, retries = 0 } = config;

    // Check authentication requirement
    if (requiresAuth && !this.authToken) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401,
      };
    }

    try {
      // Build URL
      let url = getApiUrl(config.endpoint);
      if (params) {
        url += `?${this.buildQueryString(params)}`;
      }

      // Build request options
      const requestOptions: RequestInit = {
        method,
        headers: this.buildHeaders(headers),
      };

      // Add body for POST/PUT/DELETE requests
      if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        requestOptions.body = JSON.stringify(data);
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), envConfig.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { message: response.statusText };
      }

      // Log request
      this.logRequest(config, responseData);

      // Handle response
      if (response.ok) {
        return {
          success: true,
          data: responseData.data || responseData,
          message: responseData.message,
          status: response.status,
          pagination: responseData.pagination,
        };
      } else {
        // Handle 401 - token expired
        if (response.status === 401 && this.refreshToken && retries === 0) {
          const refreshResult = await this.refreshAuthToken();
          if (refreshResult.success) {
            // Retry with new token
            return this.makeRequest({ ...config, retries: 1 });
          } else {
            // Refresh failed, clear tokens
            await this.clearTokens();
          }
        }

        // Handle 403 - permission denied
        if (response.status === 403) {
          // Could trigger automatic logout for revoked permissions
          // For now, just return the error
          console.warn('Permission denied (403) - User may need role update');
        }

        return {
          success: false,
          error: responseData.message || response.statusText,
          status: response.status,
        };
      }
    } catch (error: any) {
      const apiError = this.handleError(error, config);

      // Retry logic for network errors
      if (retries < envConfig.MAX_RETRY_ATTEMPTS && apiError.code === 'NETWORK_ERROR') {
        await new Promise(resolve => setTimeout(resolve, envConfig.RETRY_DELAY));
        return this.makeRequest({ ...config, retries: retries + 1 });
      }

      return {
        success: false,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshAuthToken(): Promise<ApiResponse> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await this.makeRequest({
        method: 'POST',
        endpoint: `${envConfig.AUTH_ENDPOINT}/refresh`,
        data: { refreshToken: this.refreshToken },
        requiresAuth: false,
      });

      if (response.success && response.data?.token) {
        await this.saveTokens(response.data.token, response.data.refreshToken);
        return { success: true };
      }

      return { success: false, error: 'Failed to refresh token' };
    } catch (error) {
      return { success: false, error: 'Token refresh failed' };
    }
  }

  // Public API methods
  public async get<T>(endpoint: string, params?: Record<string, string | number>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'GET', endpoint, params, requiresAuth });
  }

  public async post<T>(endpoint: string, data?: any, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'POST', endpoint, data, requiresAuth });
  }

  public async put<T>(endpoint: string, data?: any, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'PUT', endpoint, data, requiresAuth });
  }

  public async delete<T>(endpoint: string, data?: any, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ method: 'DELETE', endpoint, data, requiresAuth });
  }

  /**
   * Authentication methods
   */
  public async sendOTP(email: string): Promise<ApiResponse> {
    return this.post(`${envConfig.AUTH_ENDPOINT}/send-otp`, { email }, false);
  }

  public async verifyOTP(email: string, otp: string): Promise<ApiResponse> {
    const response = await this.post(`${envConfig.AUTH_ENDPOINT}/verify-otp`, { email, otp }, false);

    if (response.success && response.data?.token) {
      await this.saveTokens(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  public async getProfile(): Promise<ApiResponse> {
    return this.get(`${envConfig.AUTH_ENDPOINT}/profile`);
  }

  public async updateProfile(data: any): Promise<ApiResponse> {
    return this.put(`${envConfig.AUTH_ENDPOINT}/profile`, data);
  }

  public async logout(): Promise<void> {
    await this.clearTokens();
  }
}

// Export singleton instance
export default new ApiService();
