const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/errorHandler');
const {
  sanitizeInputs,
  csrfProtection,
  apiLimiter,
  authLimiter
} = require('./middlewares/securityMiddleware');

const authRoutes = require('./routes/authRoutes');
const repoRoutes = require('./routes/repoRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Security HTTP headers (contentSecurityPolicy disabled to allow Vite React assets)
app.use(helmet({ contentSecurityPolicy: false }));

// Determine allowed frontend origin
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Core Middlewares
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Input sanitization & CSRF defense
app.use(sanitizeInputs);
app.use('/api', csrfProtection);

// Global API rate limiter
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'devpulse-api'
    }
  });
});

// Mount Routes with auth-specific limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);

app.use('/api/repos', repoRoutes);
app.use('/api/v1/repos', repoRoutes);

app.use('/api/workspaces', workspaceRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);

app.use('/api/invitations', inviteRoutes);
app.use('/api/v1/invitations', inviteRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/v1/reports', reportRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`
    }
  });
});

// Serve static frontend assets and support SPA direct page refresh
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
