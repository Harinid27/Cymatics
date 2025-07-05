# Cymatics App - Backend Integration Guide

## Overview

This guide provides a comprehensive roadmap for integrating a backend service with the existing Cymatics React Native frontend. The frontend is currently a static implementation with hardcoded data and mock functionality.

## Current Frontend Status

### ✅ Completed Frontend Features
- **11 Main Screens**: All screens implemented with full UI
- **Navigation System**: Tab navigation + drawer menu
- **User Interface**: Complete design system with consistent styling
- **Animations**: Smooth transitions and interactive elements
- **State Management**: React Context for user data
- **Form Handling**: Input validation and modal editing
- **Image Handling**: Camera and gallery integration ready

### 🔄 Static Implementation Areas
- All data is hardcoded/mocked
- No real authentication (skip button available)
- No data persistence
- No API calls
- No real-time functionality
- Console logs instead of actual operations

## Backend Architecture Requirements

### 1. Database Schema

#### Core Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    code VARCHAR(50) UNIQUE NOT NULL, -- CYM-XX format
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INTEGER,
    amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'ongoing',
    start_date DATE,
    end_date DATE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Income table
CREATE TABLE income (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    amount DECIMAL(12,2) NOT NULL,
    received_amount DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    category VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    project_id UUID REFERENCES projects(id),
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url VARCHAR(500),
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- User links table
CREATE TABLE user_links (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    link_url VARCHAR(500) NOT NULL,
    link_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Endpoints Structure

#### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/google-login
```

#### User Management
```
GET /api/users/profile
PUT /api/users/profile
POST /api/users/upload-avatar
GET /api/users/links
POST /api/users/links
DELETE /api/users/links/:id
```

#### Project Management
```
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
POST /api/projects/:id/upload-image
GET /api/projects/codes/generate
```

#### Client Management
```
GET /api/clients
POST /api/clients
GET /api/clients/:id
PUT /api/clients/:id
DELETE /api/clients/:id
GET /api/clients/:id/projects
```

#### Financial Management
```
GET /api/income
POST /api/income
PUT /api/income/:id
DELETE /api/income/:id
GET /api/expenses
POST /api/expenses
PUT /api/expenses/:id
DELETE /api/expenses/:id
GET /api/payments
POST /api/payments
PUT /api/payments/:id
GET /api/financial/dashboard
GET /api/financial/charts
```

#### Calendar Management
```
GET /api/calendar/events
POST /api/calendar/events
PUT /api/calendar/events/:id
DELETE /api/calendar/events/:id
GET /api/calendar/events/:date
```

#### Chat System
```
GET /api/chat/conversations
GET /api/chat/messages/:conversationId
POST /api/chat/messages
PUT /api/chat/messages/:id/read
WebSocket /ws/chat
```

### 3. Frontend Integration Points

#### Replace Static Data
1. **Dashboard Statistics**: Connect to `/api/financial/dashboard`
2. **Project Lists**: Connect to `/api/projects`
3. **Client Lists**: Connect to `/api/clients`
4. **Payment Data**: Connect to `/api/payments`
5. **Calendar Events**: Connect to `/api/calendar/events`
6. **Chat Messages**: Connect to WebSocket and `/api/chat/messages`

#### Authentication Flow
1. Replace skip button with real authentication
2. Implement JWT token storage
3. Add token refresh logic
4. Handle authentication errors

#### Form Submissions
1. **Project Creation**: POST to `/api/projects`
2. **Expense Addition**: POST to `/api/expenses`
3. **Client Management**: CRUD operations via API
4. **Profile Updates**: PUT to `/api/users/profile`
5. **Payment Updates**: PUT to `/api/payments/:id`

#### Real-time Features
1. **Chat Messages**: WebSocket integration
2. **Payment Notifications**: Push notifications
3. **Project Updates**: Real-time status changes
4. **Calendar Reminders**: Notification system

### 4. File Upload Integration

#### Image Upload Points
- Profile pictures
- Project images
- Expense receipts
- Chat file attachments

#### Implementation
```typescript
// Example file upload function
const uploadImage = async (imageUri: string, endpoint: string) => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  return response.json();
};
```

### 5. State Management Updates

#### API Integration Layer
```typescript
// Create API service layer
class ApiService {
  private baseURL = 'https://api.cymatics.com';
  private token: string | null = null;

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Implement specific methods for each endpoint
  async getProjects() {
    return this.request('/api/projects');
  }

  async createProject(projectData: any) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }
  
  // ... other methods
}
```

#### Context Updates
```typescript
// Update UserContext to handle API calls
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiService = new ApiService();

  const loadUserData = async () => {
    try {
      const data = await apiService.getUserProfile();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    try {
      const updatedData = await apiService.updateUserProfile(data);
      setUserData(updatedData);
    } catch (error) {
      console.error('Failed to update user data:', error);
    }
  };

  // ... rest of implementation
};
```

## Implementation Priority

### Phase 1: Core Backend (Weeks 1-2)
1. Set up database schema
2. Implement authentication system
3. Create basic CRUD APIs for projects, clients, expenses
4. Set up file upload system

### Phase 2: Frontend Integration (Weeks 3-4)
1. Replace static data with API calls
2. Implement authentication flow
3. Add error handling and loading states
4. Test all CRUD operations

### Phase 3: Real-time Features (Weeks 5-6)
1. Implement WebSocket for chat
2. Add push notifications
3. Real-time data updates
4. Performance optimization

### Phase 4: Advanced Features (Weeks 7-8)
1. Advanced analytics and reporting
2. Data export functionality
3. Advanced search and filtering
4. Performance monitoring

## Testing Strategy

### Backend Testing
- Unit tests for all API endpoints
- Integration tests for database operations
- Authentication flow testing
- File upload testing

### Frontend Integration Testing
- API integration tests
- Authentication flow tests
- Real-time feature tests
- Cross-platform compatibility tests

This guide provides a complete roadmap for transforming the static Cymatics frontend into a fully functional business management application with robust backend integration.
