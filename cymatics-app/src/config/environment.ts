/**
 * Environment Configuration
 * Centralized configuration for API endpoints and app settings
 */

// For React Native, we'll use a simple configuration object
// In production, you can replace these values or use react-native-config

interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;

  // Development Settings
  NODE_ENV: 'development' | 'production' | 'staging';
  DEBUG_MODE: boolean;

  // Authentication Settings
  TOKEN_STORAGE_KEY: string;
  REFRESH_TOKEN_KEY: string;

  // API Endpoints
  AUTH_ENDPOINT: string;
  DASHBOARD_ENDPOINT: string;
  PROJECTS_ENDPOINT: string;
  CLIENTS_ENDPOINT: string;
  FINANCIAL_ENDPOINT: string;
  CALENDAR_ENDPOINT: string;
  PAYMENTS_ENDPOINT: string;
  BUDGET_ENDPOINT: string;
  ASSETS_ENDPOINT: string;
  ENTERTAINMENT_ENDPOINT: string;
  MAPS_ENDPOINT: string;

  // Network Configuration
  MAX_RETRY_ATTEMPTS: number;
  RETRY_DELAY: number;
  REQUEST_TIMEOUT: number;

  // Cache Configuration
  CACHE_DURATION: number;
  ENABLE_CACHE: boolean;

  // Logging
  ENABLE_API_LOGGING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// Get API URL from environment or use default
const getApiBaseUrl = (): string => {
  // Try to get from environment variable first
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    console.log('📍 Using API URL from environment:', envUrl);
    return envUrl;
  }

  // Fallback to your computer's IP for mobile testing
  const defaultUrl = 'http://192.168.149.104:3000';
  console.log('📍 Using default API URL:', defaultUrl);
  return defaultUrl;
};

// Default configuration - modify these values as needed
const config: EnvironmentConfig = {
  // API Configuration - automatically uses environment variable or fallback
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: 10000,

  // Development Settings
  NODE_ENV: 'development',
  DEBUG_MODE: true,

  // Authentication Settings
  TOKEN_STORAGE_KEY: 'cymatics_auth_token',
  REFRESH_TOKEN_KEY: 'cymatics_refresh_token',

  // API Endpoints
  AUTH_ENDPOINT: '/api/auth',
  DASHBOARD_ENDPOINT: '/api/dashboard',
  PROJECTS_ENDPOINT: '/api/projects',
  CLIENTS_ENDPOINT: '/api/clients',
  FINANCIAL_ENDPOINT: '/api/financial',
  CALENDAR_ENDPOINT: '/api/calendar',
  PAYMENTS_ENDPOINT: '/api/payments',
  BUDGET_ENDPOINT: '/api/budget',
  ASSETS_ENDPOINT: '/api/assets',
  ENTERTAINMENT_ENDPOINT: '/api/entertainment',
  MAPS_ENDPOINT: '/api/maps',

  // Network Configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,

  // Cache Configuration
  CACHE_DURATION: 300000, // 5 minutes
  ENABLE_CACHE: true,

  // Logging
  ENABLE_API_LOGGING: true,
  LOG_LEVEL: 'debug',
};

// Environment-specific overrides
const environmentOverrides = {
  development: {
    API_BASE_URL: getApiBaseUrl(),
    DEBUG_MODE: true,
    ENABLE_API_LOGGING: true,
  },
  staging: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-staging-api.com',
    DEBUG_MODE: true,
    ENABLE_API_LOGGING: true,
  },
  production: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com',
    DEBUG_MODE: false,
    ENABLE_API_LOGGING: false,
    LOG_LEVEL: 'error' as const,
  },
};

// Apply environment-specific overrides
const currentEnv = config.NODE_ENV;
const envConfig = { ...config, ...environmentOverrides[currentEnv] };

export default envConfig;

// Helper functions for easy access
export const getApiUrl = (endpoint: string = ''): string => {
  return `${envConfig.API_BASE_URL}${endpoint}`;
};

export const isDebugMode = (): boolean => {
  return envConfig.DEBUG_MODE;
};

export const shouldLogApi = (): boolean => {
  return envConfig.ENABLE_API_LOGGING;
};

// Export individual config values for convenience
export const {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_KEY,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY,
  REQUEST_TIMEOUT,
  CACHE_DURATION,
  ENABLE_CACHE,
} = envConfig;
