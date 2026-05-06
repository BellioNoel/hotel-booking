// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes after environment variables are loaded
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';
import configRoutes from './routes/config.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 booking requests per windowMs
  message: {
    error: 'Too many booking attempts, please try again later.'
  }
});

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://your-domain.com'] // Replace with actual production domain
  : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('❌ Please check your MONGODB_URI in .env file');
  console.error('❌ Server will continue running but database operations will fail');
  // Don't exit in development, but log the error clearly
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Verify Cloudinary configuration
async function verifyCloudinary() {
  try {
    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Test Cloudinary connection by trying to access the API
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      console.log('✅ Cloudinary configured successfully');
    } else {
      console.warn('⚠️  Cloudinary configuration incomplete - image uploads may not work');
    }
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error);
    console.warn('⚠️  Image uploads will not be available');
  }
}

verifyCloudinary();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/config', configRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'This resource already exists'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});
