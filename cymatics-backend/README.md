# Cymatics Backend - Node.js/Express API

A comprehensive project management backend for creative professionals, built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **Authentication**: OTP-based email authentication
- **Client Management**: Comprehensive client and outsourcing client management
- **Project Management**: Full project lifecycle tracking with financial calculations
- **Financial Tracking**: Income and expense management with profit calculations
- **Asset Management**: Equipment and resource tracking
- **Calendar Integration**: Event scheduling and management
- **Map Integration**: Google Maps API for project locations
- **File Upload**: Image upload with processing
- **Real-time Analytics**: Dashboard statistics and reporting

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Session-based
- **Email**: Nodemailer with Gmail SMTP
- **File Upload**: Multer with Sharp for image processing
- **Maps**: Google Maps API
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 14+
- Gmail account for SMTP (or other email service)
- Google Maps API key

## 🔧 Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd Cymatics/cymatics-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Optional: Seed database with sample data
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

## 🗄 Database Schema

The application uses the following main entities:

- **Users**: Authentication and user management
- **Clients**: Regular clients
- **Outclients**: Outsourcing clients
- **Projects**: Main business entity with financial tracking
- **Income**: Revenue tracking
- **Expenses**: Cost tracking
- **Assets**: Equipment management
- **Entertainment**: Personal tracking
- **CalendarEvents**: Scheduling
- **EmailOTPs**: Authentication tokens

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `SMTP_USER` | Email username | Required |
| `SMTP_PASS` | Email password | Required |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Required |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── app.ts          # Express app setup
```

## 🔄 Migration Status

This backend is a complete migration from the Django backend with the following features implemented:

### ✅ Completed (Phase 1)
- [x] Project setup and infrastructure
- [x] Database schema with Prisma
- [x] Authentication system (OTP-based)
- [x] Email service integration
- [x] Google Maps service
- [x] Error handling and logging
- [x] File upload middleware
- [x] Validation middleware
- [x] Basic API structure

### 🚧 In Progress (Phase 2)
- [ ] Client management APIs
- [ ] Project management APIs
- [ ] Financial management APIs
- [ ] Asset management APIs
- [ ] Entertainment APIs
- [ ] Calendar APIs

### 📋 Upcoming (Phase 3)
- [ ] Advanced search and filtering
- [ ] Dashboard analytics
- [ ] Data migration from Django
- [ ] Performance optimization
- [ ] Comprehensive testing

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api`
- Review the logs in the `logs/` directory
- Check the health endpoint at `/health`

---

**Cymatics Backend** - Empowering creative professionals with comprehensive project management tools.
