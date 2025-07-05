# Frontend-Backend Integration Guide

## Overview

This document provides a comprehensive guide for integrating the Cymatics frontend (React Native/Expo) with the backend server running at `http://141.148.219.249:3000`.

## 🚀 Quick Start

### 1. Update API Base URL

The main change required is updating the API base URL in your frontend configuration.

**File:** `cymatics-app/src/config/environment.ts`

**Current Configuration:**
```typescript
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    console.log('📍 Using API URL from environment:', envUrl);
    return envUrl;
  }
  
  // Fallback to your computer's IP for mobile testing
  const defaultUrl = 'http://192.168.227.96:3000';
  console.log('📍 Using default API URL:', defaultUrl);
  return defaultUrl;
};
```

**Required Changes:**

#### Option A: Environment Variable (Recommended)
Set the environment variable in your `.env` file:
```bash
EXPO_PUBLIC_API_URL=http://141.148.219.249:3000
```

#### Option B: Direct Update
Update the default URL in the configuration:
```typescript
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    console.log('📍 Using API URL from environment:', envUrl);
    return envUrl;
  }
  
  // Updated default URL for production backend
  const defaultUrl = 'http://141.148.219.249:3000';
  console.log('📍 Using default API URL:', defaultUrl);
  return defaultUrl;
};
```

### 2. Update CORS Configuration

**File:** `cymatics-backend/src/config/index.ts`

Add your frontend URLs to the CORS origins:

```typescript
cors: {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://192.168.227.96:19006',
    'http://192.168.227.96:8081',
    // Allow React Native/Expo development
    'exp://192.168.227.96:19000',
    'exp://localhost:19000',
    // Add your production frontend URLs here
    'http://141.148.219.249:19006',
    'exp://141.148.219.249:19000'
  ],
},
```

## 📋 API Endpoints Reference

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP

### Project Endpoints
- `GET /api/projects` - Get all projects (with pagination)
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/code/:code` - Get project by code
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/status/:status` - Get projects by status
- `PUT /api/projects/:id/status` - Update project status
- `GET /api/projects/codes/generate` - Generate new project code

### Financial Endpoints
- `GET /api/financial/summary` - Get financial summary
- `GET /api/financial/income` - Get income data
- `GET /api/financial/expenses` - Get expense data
- `POST /api/financial/income` - Add income record
- `POST /api/financial/expenses` - Add expense record
- `GET /api/financial/budget` - Get budget data
- `GET /api/financial/income/chart-data` - Get income chart data

### Dashboard Endpoints
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activities` - Get recent activities

### Client Endpoints
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Calendar Endpoints
- `GET /api/calendar/events/range` - Get events for date range
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:id` - Update calendar event
- `DELETE /api/calendar/events/:id` - Delete calendar event

### Maps Endpoints
- `GET /api/maps/projects` - Get projects for map display
- `GET /api/maps/geocode` - Geocode address
- `GET /api/maps/directions` - Get directions between points

### Budget Endpoints
- `GET /api/budget/overview` - Get budget overview
- `GET /api/budget/categories` - Get budget categories
- `GET /api/budget/investment-details` - Get investment details

### Payment Endpoints
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment record
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

## 🔧 Service Layer Updates

### 1. ApiService Configuration

**File:** `cymatics-app/src/services/ApiService.ts`

The ApiService is already configured to use the environment configuration. No changes needed unless you want to update the hardcoded token:

```typescript
// Remove or update this hardcoded token for production
this.authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### 2. Service Layer Compatibility

All service files are already using the environment configuration:

- `ProjectsService.ts` ✅
- `BudgetService.ts` ✅
- `CalendarService.ts` ✅
- `FinancialService.ts` ✅
- `AuthService.ts` ✅

## 🔐 Authentication Flow

### Current Implementation
The frontend uses JWT tokens stored in AsyncStorage:

```typescript
// Token storage keys
TOKEN_STORAGE_KEY: 'cymatics_auth_token',
REFRESH_TOKEN_KEY: 'cymatics_refresh_token',
```

### Authentication Headers
All API requests automatically include the Authorization header:

```typescript
headers.Authorization = `Bearer ${this.authToken}`;
```

## 📱 React Native/Expo Specific Considerations

### 1. Network Security (Android)
For Android, you may need to configure network security to allow HTTP requests to your server.

**File:** `cymatics-app/app.json`
```json
{
  "expo": {
    "android": {
      "networkSecurityConfig": {
        "cleartextTrafficPermitted": true
      }
    }
  }
}
```

### 2. iOS Network Configuration
For iOS, ensure your app allows arbitrary loads or add your server to the allowed domains.

### 3. Expo Development
When using Expo Go, ensure your device can reach the server IP address.

## 🧪 Testing the Integration

### 1. Health Check
Test the basic connectivity:
```bash
curl http://141.148.219.249:3000/health
```

### 2. API Documentation
Access the API documentation:
```bash
curl http://141.148.219.249:3000/api
```

### 3. Frontend Testing
In your React Native app, you can test the connection:

```typescript
import ApiService from './src/services/ApiService';

// Test API connection
const testConnection = async () => {
  try {
    const response = await ApiService.get('/health');
    console.log('✅ Backend connection successful:', response);
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
  }
};
```

## 🔄 Data Format Compatibility

### Project Data Structure
The backend returns project data in this format:

```typescript
interface Project {
  id: string;
  code: string;
  name: string;
  company?: string;
  type?: string;
  status: string;
  shootStartDate?: string;
  shootEndDate?: string;
  amount: number;
  pendingAmt: number;
  receivedAmt: number;
  profit: number;
  location?: string;
  address?: string;
  outsourcing: boolean;
  reference?: string;
  outsourcingAmt?: number;
  outFor?: string;
  outClient?: string;
  outsourcingPaid: boolean;
  onedriveLink?: string;
  rating: number;
  latitude?: number;
  longitude?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
    company?: string;
    email: string;
  };
}
```

### API Response Format
All API responses follow this structure:

```typescript
interface ApiResponse<T = any> {
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
```

## 🚨 Error Handling

### Network Errors
The ApiService includes automatic retry logic and error handling:

```typescript
// Automatic retry on network failures
MAX_RETRY_ATTEMPTS: 3,
RETRY_DELAY: 1000,
REQUEST_TIMEOUT: 30000,
```

### Authentication Errors
- 401 Unauthorized: Token expired or invalid
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource doesn't exist
- 500 Internal Server Error: Server-side error

## 🔧 Environment-Specific Configuration

### Development
```typescript
development: {
  API_BASE_URL: 'http://141.148.219.249:3000',
  DEBUG_MODE: true,
  ENABLE_API_LOGGING: true,
}
```

### Production
```typescript
production: {
  API_BASE_URL: 'https://your-production-domain.com',
  DEBUG_MODE: false,
  ENABLE_API_LOGGING: false,
  LOG_LEVEL: 'error',
}
```

## 📝 Migration Checklist

- [ ] Update API base URL in environment configuration
- [ ] Add frontend URLs to backend CORS configuration
- [ ] Test basic connectivity with health endpoint
- [ ] Verify authentication flow works
- [ ] Test all major features (projects, financial, calendar, etc.)
- [ ] Update any hardcoded URLs in components
- [ ] Test on both iOS and Android devices
- [ ] Verify error handling and retry logic
- [ ] Check network security configuration
- [ ] Update environment variables for production

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your frontend URL is in the CORS origins list
   - Check that the backend is running and accessible

2. **Network Timeout**
   - Verify the server IP is reachable from your device
   - Check firewall settings on the server

3. **Authentication Failures**
   - Verify JWT token is valid and not expired
   - Check that the token is being sent in Authorization header

4. **Data Format Mismatches**
   - Compare frontend interface definitions with backend response format
   - Check for date format differences

### Debug Mode
Enable debug logging in the environment configuration:

```typescript
DEBUG_MODE: true,
ENABLE_API_LOGGING: true,
LOG_LEVEL: 'debug',
```

## 📞 Support

If you encounter issues during integration:

1. Check the backend logs for errors
2. Verify network connectivity
3. Test API endpoints directly with cURL or Postman
4. Review the error handling in ApiService
5. Check the browser/device console for detailed error messages

---

**Last Updated:** July 5, 2025  
**Backend Server:** http://141.148.219.249:3000  
**Frontend Repository:** cymatics-app  
**Backend Repository:** cymatics-backend 