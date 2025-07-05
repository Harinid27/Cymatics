import app from './app';
import { config } from '@/config';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';

const PORT = config.port;

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await disconnectDatabase();
    logger.info('Database disconnected successfully');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server - bind to all interfaces (0.0.0.0) for network access
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Cymatics Backend Server is running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API docs: http://localhost:${PORT}/api`);
      logger.info(`🌐 Network access: http://0.0.0.0:${PORT}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
