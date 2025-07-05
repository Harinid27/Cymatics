# Cymatics App - Detailed Features Documentation

## Core Features & Screens Analysis

### 1. Authentication Flow

#### Splash Screen (`app/index.js`)
- **Purpose**: Initial app loading screen
- **Features**:
  - Automatic navigation to signup after 100ms
  - Clean white background
  - Minimal loading state
- **Backend Requirements**: None (static)

#### Animated Signup Screen (`app/signup-animated.js`)
- **Purpose**: User registration with smooth animations
- **Features**:
  - Logo animation from center to top
  - Form elements fade-in animation
  - Email validation
  - Google signup option
  - Terms of Service and Privacy Policy links
  - Skip to Dashboard option (development)
- **Animations**:
  - Logo position and scale transitions
  - Form opacity and translateY animations
  - 1.5s splash duration followed by smooth transitions
- **Backend Requirements**:
  - User registration API
  - Email validation
  - Google OAuth integration
  - Terms acceptance tracking

#### Registration Screen (`app/register.js`)
- **Purpose**: Additional registration form (if needed)
- **Status**: File exists but content not examined in detail

### 2. Main Dashboard (`app/(tabs)/index.tsx`)

#### Overview Cards
- **Financial Summary**:
  - Overall Income: $8,70,000 (+20% over month)
  - Total Expense: $2,40,235 (+33% over month)
  - Current Balance: $1,50,000 (+15% over month)
- **Features**:
  - Horizontal scrollable income statistics
  - Quick navigation buttons (Status, Clients, Map)
  - Today's shoot information display
  - Header with menu drawer and profile access

#### Navigation Elements
- **Header**: Menu button, title, message button, profile button
- **Status Navigation**: Status, Clients, Map quick access
- **Today Shoot Section**: Current project information with camera icon

#### Backend Requirements
- Real-time financial calculations
- Dashboard analytics API
- Today's schedule integration
- User-specific data filtering

### 3. Project Management (`app/(tabs)/projects.tsx`)

#### Project Display
- **Project Cards**:
  - Project images from Unsplash
  - Duration display (e.g., "3 MONTHS")
  - Project codes (CYM-82, CYM-83, etc.)
  - Project titles (Industry Shoot, Corporate Event, etc.)
- **Actions**:
  - Files button for project documents
  - Share button for project sharing
  - Floating add button for new projects

#### Sample Projects
- Industry Shoot (CYM-82) - 3 months
- Corporate Event (CYM-83) - 2 months
- Product Launch (CYM-84) - 4 months
- Fashion Shoot (CYM-85) - 1 month

#### Backend Requirements
- Project CRUD operations
- File management system
- Project sharing functionality
- Image upload and storage
- Project code generation system

### 4. Financial Management

#### Income Tracking (`app/(tabs)/income.tsx`)
- **Chart Visualization**:
  - Project Valuation vs Payment Received bar chart
  - Monthly data visualization
  - Color-coded legend (Blue for Valuation, Pink for Received)
- **Payment History**:
  - Tabs: Ongoing, Pending, Completed
  - Payment status tracking
  - Client-wise payment information
- **Sample Data**:
  - Monthly values ranging from $10K to $50K
  - Visual comparison between expected and received amounts

#### Expense Management (`app/(tabs)/expense.tsx`)
- **Expense Categories**:
  - Petrol: $53,445 (multiple entries)
  - Equipment Rental: $2,800
  - Travel: $1,200
  - Food & Catering: $850
  - Office Supplies: $450
  - Software License: $299
  - Marketing: $1,500
  - Insurance: $750
  - Maintenance: $320
  - Utilities: $180
  - Training: $600
- **Features**:
  - Search and filter functionality
  - Categorized expense display with icons
  - Date-wise expense tracking
  - Floating add button for new expenses

#### Budget Management (`app/budget.tsx`)
- **Balance Overview**:
  - Current Balance: $3,434,634
  - Received Amount: $46,343 (This Month)
- **Visualizations**:
  - Total Received Amount line chart
  - Monthly data from JAN to JUL
  - Values ranging from $150K to $450K
- **Budget Split Up**:
  - Multiple Cymatics entries at $42,337 each
  - Color-coded categories
- **Investment Details**:
  - Budget vs Expense vs Balance comparison
  - All showing $54,525 (sample data)

#### Backend Requirements
- Real-time financial calculations
- Expense categorization system
- Payment tracking and status updates
- Budget allocation and monitoring
- Financial reporting and analytics
- Chart data generation APIs

### 5. Client Management (`app/clients.tsx`)

#### Client Information
- **Client Display**:
  - Client name with project count (e.g., "3 Monks (23)")
  - Subtitle information (e.g., "Prabu")
  - Action buttons: Share, Call, Edit
- **Sample Clients**:
  - Multiple "3 Monks" entries with count 23
  - Contact person: Prabu

#### Backend Requirements
- Client CRUD operations
- Contact management system
- Project count tracking per client
- Communication history
- Client relationship management

### 6. Project Status (`app/status.tsx`)

#### Status Categories
- **Ongoing Projects**: 10 entries
- **Pending Projects**: 6 entries
- **Completed Projects**: 6 entries
- **Sample Data**: "Kedarkantha" projects with $1,000 pending amounts

#### Features
- Tab-based filtering
- Pending amount display
- Client avatar with initials
- Status-specific data filtering

#### Backend Requirements
- Project status tracking system
- Real-time status updates
- Payment status integration
- Project lifecycle management

### 7. Payment Management (`app/pending-payments.tsx`)

#### Payment Categories
- **Ongoing Payments**: 10 entries
- **Pending Payments**: 8 entries
- **Completed Payments**: 10 entries

#### Payment Information
- Client names (Kedarkantha, Rajesh Kumar, Priya Sharma, etc.)
- Payment amounts ($2,600 to $5,200 range)
- Payment dates (April 2024)
- Edit functionality for each payment

#### Backend Requirements
- Payment tracking system
- Payment status management
- Client payment history
- Payment reminder system
- Financial reconciliation

### 8. Calendar (`app/(tabs)/calendar.tsx`)

#### Calendar Features
- **Interactive Calendar**:
  - Month navigation with arrows
  - Date selection functionality
  - Today's date highlighting
  - Month dropdown selector
- **Current Date Display**: Format "Day, Mon DD"
- **Search Functionality**: Search bar for events
- **Dynamic Calendar Generation**: Proper month/year handling

#### Backend Requirements
- Event management system
- Calendar integration APIs
- Reminder and notification system
- Schedule conflict detection
- Multi-user calendar sharing

### 9. User Profile (`app/profile.tsx`)

#### Profile Management
- **Profile Image**:
  - Camera and gallery access
  - Image cropping (1:1 aspect ratio)
  - Default avatar with person icon
- **Editable Fields**:
  - Name: "Vijay Yasodharan"
  - Username: "@vy"
  - Email: "vjyaso@cymatics.in" (read-only)
  - Bio: "The one and only Yaso."
  - Links: "Cymatics.in" with add link functionality
- **Modal Editing**: Popup forms for field editing

#### Backend Requirements
- User profile management
- Image upload and storage
- Profile data validation
- Social links management
- User preferences storage

### 10. Chat Interface (`app/chat.tsx`)

#### Chat Features
- **Message Display**:
  - Own messages (black bubbles, right-aligned)
  - Other messages (gray bubbles, left-aligned)
  - Avatar display for other users
  - Timestamp support
- **Input Features**:
  - Text input with multiline support
  - Microphone button
  - Emoji button
  - Camera button
- **Contact Information**:
  - Contact name: "VY Vijay Yaso"
  - Activity status: "Active 20m ago"
  - Call and video call buttons

#### Sample Conversation
- Template conversation about chat functionality
- Mixed message types (questions, responses, explanations)
- Proper message threading

#### Backend Requirements
- Real-time messaging system
- Message storage and retrieval
- User presence tracking
- File and media sharing
- Push notifications for messages

### 11. Navigation System

#### Menu Drawer (`components/MenuDrawer.tsx`)
- **Menu Items**:
  - Home, Projects, Income, Expense (tab items)
  - Status, Clients, Pending Payments, Calendar, Budget (standalone)
- **Features**:
  - Cymatics logo display
  - Active state highlighting
  - Smooth slide animations
  - Route-based active detection

#### Tab Navigation
- **Bottom Tabs**: Home, Projects, Income, Expense, Calendar
- **Icons**: Material Icons for each tab
- **Active States**: Color changes and highlighting

#### Backend Requirements
- User permission management
- Menu customization based on user roles
- Navigation analytics
- Feature access control

## Data Models & Structures

### User Data Model
```typescript
interface UserData {
  name: string;           // "Vijay Yasodharan"
  username: string;       // "@vy"
  email: string;          // "vjyaso@cymatics.in"
  bio: string;           // "The one and only Yaso."
  links: string[];       // ["Cymatics.in"]
  profileImage?: string; // URI to profile image
}
```

### Project Data Model
```typescript
interface Project {
  id: number;
  duration: string;      // "3 MONTHS"
  code: string;         // "CYM-82"
  title: string;        // "Industry Shoot"
  image: string;        // Image URL
  status: 'ongoing' | 'pending' | 'completed';
  amount: number;
  client: string;
  startDate: Date;
  endDate: Date;
}
```

### Financial Data Models
```typescript
interface Income {
  id: string;
  projectId: string;
  amount: number;
  receivedAmount: number;
  date: Date;
  status: 'ongoing' | 'pending' | 'completed';
}

interface Expense {
  id: string;
  type: string;         // "Petrol", "Equipment Rental", etc.
  amount: number;
  date: Date;
  category: string;
  icon: string;         // Material Icon name
  description?: string;
}
```

### Client Data Model
```typescript
interface Client {
  id: string;
  name: string;         // "3 Monks"
  contactPerson: string; // "Prabu"
  projectCount: number; // 23
  email?: string;
  phone?: string;
  address?: string;
}
```

### Payment Data Model
```typescript
interface Payment {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'ongoing' | 'pending' | 'completed';
}
```

### Message Data Model
```typescript
interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  senderId: string;
  receiverId: string;
  messageType: 'text' | 'image' | 'file';
  avatar?: string;
}
```

## UI Components & Styling

### Design System
- **Primary Colors**: Black (#000000), White (#FFFFFF)
- **Accent Colors**: Blue (#4285F4), Red (#FF9999), Green (#4CAF50)
- **Gray Scale**: #f8f9fa, #e0e0e0, #999999, #666666
- **Border Radius**: 8px, 12px, 15px, 20px, 25px
- **Shadows**: Consistent elevation with shadowColor, shadowOffset, shadowOpacity

### Typography Scale
- **Headers**: 18px, 20px, 24px (fontWeight: '600')
- **Body Text**: 14px, 16px (fontWeight: '400', '500')
- **Small Text**: 10px, 11px, 12px (fontWeight: '400')
- **Font Family**: System default with SpaceMono for special cases

### Component Patterns
- **Cards**: White background, rounded corners, subtle shadows
- **Buttons**: Black primary, white secondary, rounded corners
- **Input Fields**: White background, border, rounded corners
- **Floating Actions**: Circular, elevated, bottom-right positioning

## Current Limitations & Static Data

### Hardcoded Data Examples
- **Financial Values**: $8,70,000 income, $2,40,235 expenses
- **Project Codes**: CYM-82, CYM-83, CYM-84, CYM-85
- **Client Names**: "3 Monks", "Kedarkantha", various Indian names
- **Dates**: Mostly April 2024 dates
- **Amounts**: Range from $180 to $53,445

### Missing Real Functionality
- **No Data Persistence**: All data resets on app restart
- **No Authentication**: Skip button bypasses login
- **No File Operations**: File buttons are non-functional
- **No Real Communication**: Chat and call buttons are placeholders
- **No Search Results**: Search bars are UI-only
- **No Form Submissions**: Forms show alerts instead of processing

### Development Shortcuts
- **Skip to Dashboard**: Development bypass for authentication
- **Mock Conversations**: Predefined chat messages
- **Static Charts**: Hardcoded chart data points
- **Placeholder Images**: Unsplash URLs for project images
- **Console Logs**: Button actions log to console instead of functioning

## Performance Considerations

### Current Implementation
- **Image Loading**: External URLs may cause slow loading
- **List Rendering**: FlatList used for efficient scrolling
- **Animation Performance**: useNativeDriver for smooth animations
- **Memory Management**: Proper component unmounting

### Optimization Opportunities
- **Image Caching**: Implement proper image caching
- **Data Virtualization**: For large lists when backend is integrated
- **Bundle Splitting**: Code splitting for better load times
- **State Optimization**: Minimize unnecessary re-renders

## Security Considerations for Backend

### Authentication Security
- **JWT Token Management**: Secure token storage and refresh
- **Password Security**: Proper hashing and validation
- **Session Management**: Secure session handling
- **OAuth Integration**: Secure Google login implementation

### Data Security
- **API Security**: Rate limiting, input validation
- **File Upload Security**: File type validation, size limits
- **Data Encryption**: Sensitive data encryption
- **Access Control**: Role-based permissions

### Privacy Considerations
- **User Data Protection**: GDPR compliance
- **Chat Privacy**: End-to-end encryption for messages
- **Financial Data**: PCI compliance for payment data
- **Image Privacy**: Secure image storage and access
