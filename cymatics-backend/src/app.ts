/// <reference path="./types/express.d.ts" />

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import path from 'path';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { notFoundHandler } from '@/middleware/notFound.middleware';

// Import routes
import authRoutes from '@/routes/auth.routes';
import clientRoutes from '@/routes/client.routes';
import outclientRoutes from '@/routes/outclient.routes';
import projectRoutes from '@/routes/project.routes';
import financialRoutes from '@/routes/financial.routes';
import assetRoutes from '@/routes/asset.routes';
import entertainmentRoutes from '@/routes/entertainment.routes';
import calendarRoutes from '@/routes/calendar.routes';
import mapsRoutes from '@/routes/maps.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import budgetRoutes from '@/routes/budget.routes';
import paymentRoutes from '@/routes/payment.routes';
import usersRoutes from '@/routes/users.routes';
import projectCompletionRoutes from '@/routes/projectCompletion.routes';
import dataReconciliationRoutes from '@/routes/dataReconciliation.routes';
import scheduledJobsService from '@/services/scheduledJobs.service';

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const corsOrigin = config.cors.origin;
const allowAllOrigins = corsOrigin === '*' || corsOrigin === true;

app.use(cors({
  origin: allowAllOrigins ? true : corsOrigin,
  credentials: !allowAllOrigins, // Disable credentials for wildcard origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: config.session.maxAge,
  },
}));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/outclients', outclientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/project-completion', projectCompletionRoutes);
app.use('/api/data-reconciliation', dataReconciliationRoutes);

// API documentation route
app.get('/api', (_req, res) => {
  res.json({
    message: 'Cymatics Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      outclients: '/api/outclients',
      projects: '/api/projects',
      financial: '/api/financial',
      assets: '/api/assets',
      entertainment: '/api/entertainment',
      calendar: '/api/calendar',
      maps: '/api/maps',
      dashboard: '/api/dashboard',
      budget: '/api/budget',
      payments: '/api/payments',
      users: '/api/users',
      projectCompletion: '/api/project-completion',
      dataReconciliation: '/api/data-reconciliation',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start scheduled jobs in production
if (config.env === 'production') {
  scheduledJobsService.startScheduledJobs();
  logger.info('Scheduled jobs started for production environment');
}

export default app;
