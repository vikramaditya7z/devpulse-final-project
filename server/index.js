const path = require('path');
const dotenv = require('dotenv');
// Load environment variables before any other module (supporting root or server execution)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5001;

let server;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[DevPulse Server] Running on http://localhost:${PORT}`);
      console.log(`[DevPulse Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[DevPulse Server] Failed to connect to database:', error.message);
    console.warn('[DevPulse Server] Server will not start without a valid database connection. Check MONGO_URI.');
    process.exit(1);
  }
};

// Graceful Shutdown Handlers
const handleShutdown = async (signal) => {
  console.log(`\n[DevPulse Server] ${signal} signal received. Closing HTTP server and database connection...`);
  if (server) {
    server.close(async () => {
      console.log('[DevPulse Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();
