// Server without MongoDB dependency for testing
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message: 'Server is running without MongoDB for testing'
  });
});

// Mock API endpoints for testing
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: [
      {
        _id: '1',
        name: 'Deluxe Room',
        description: 'A beautiful deluxe room with city view',
        price: 50000,
        capacity: 2,
        images: ['https://via.placeholder.com/400x300'],
        isAvailable: true
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRooms: 1
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    message: 'User registered successfully (mock)',
    token: 'mock-jwt-token',
    user: {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: req.body.email,
      role: 'user'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    message: 'Login successful (mock)',
    token: 'mock-jwt-token',
    user: {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: req.body.email,
      role: 'user'
    }
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  console.log('Password reset code for testing: 123456');
  res.json({
    message: 'If an account with this email exists, a password reset code has been sent.'
  });
});

app.post('/api/auth/verify-reset-code', (req, res) => {
  if (req.body.code === '123456') {
    res.json({
      message: 'Reset code verified successfully',
      verified: true
    });
  } else {
    res.status(400).json({ error: 'Invalid or expired reset code' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  res.json({
    message: 'Password reset successfully'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
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
  console.log('🚀 Server running on port', PORT);
  console.log('📊 Environment:', process.env.NODE_ENV);
  console.log('🔗 API URL: http://localhost:' + PORT + '/api');
  console.log('⚠️  Running in MOCK MODE - MongoDB not connected');
  console.log('💡 Use 123456 as password reset code for testing');
});
