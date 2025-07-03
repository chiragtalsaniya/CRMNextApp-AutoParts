import express from 'express';
import http from 'http';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/companies.js';
import storeRoutes from './routes/stores.js';
import retailerRoutes from './routes/retailers.js';
import partRoutes from './routes/parts.js';
import orderRoutes from './routes/orders.js';
import regionRoutes from './routes/regions.js';
import reportRoutes from './routes/reports.js';
import itemStatusRoutes from './routes/item-status.js';
import transportRoutes from './routes/transport.js';
import orderStatusHistoryRoutes from './routes/order-status-history.js';

// Import database connection
import { connectDB } from './config/database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB().catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

// Trust proxy for production deployments behind reverse proxy/load balancer
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Use env variable for max requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://yogrind.shop',
      'https://www.yogrind.shop',
      'http://localhost:8081',
      'https://localhost:8081',
      'http://localhost:3000',
      'https://localhost:3000',
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true, // Enable credentials for authentication
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Version',
    'X-Mobile-App',
    'X-App-Version',
    'X-Platform',
    'X-Requested-With',
    'X-Mobile-Secret',
    'X-Device-Platform',
    'X-App-Environment',
    'X-Request-ID',
    'Accept',
    'Origin',
    'X-Requested-With'
  ]
}));

// Handle preflight requests
// Explicitly handle preflight OPTIONS for all API routes, always respond with CORS headers
app.options('/api/*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/item-status', itemStatusRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/order-status-history', orderStatusHistoryRoutes);

// No-cache headers for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Health check endpoint with more detailed info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors_origins: corsOrigins,
    database: 'connected',
    server: 'running'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files
  const frontendPath = path.join(__dirname, '../dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    
    // Handle SPA routing - send all non-API requests to index.html
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      }
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API route not found' });
  } else {
    res.status(404).send('Not found');
  }
});

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Trust Proxy: ${app.get('trust proxy')}`);
  console.log(`🌐 CORS Origins: yogrind.shop, localhost`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

export default app;