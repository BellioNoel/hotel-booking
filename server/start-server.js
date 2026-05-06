// Complete server setup with fallback
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
    mongodb: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
    message: 'Hotel Booking API is running'
  });
});

// Mock rooms data
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: [
      {
        _id: '1',
        name: 'Deluxe Suite',
        description: 'Luxurious suite with city view, king-size bed, and modern amenities',
        price: 75000,
        capacity: 2,
        images: ['https://via.placeholder.com/400x300?text=Deluxe+Suite'],
        isAvailable: true,
        roomType: 'deluxe',
        bedType: 'king'
      },
      {
        _id: '2',
        name: 'Standard Room',
        description: 'Comfortable standard room with all essential amenities',
        price: 50000,
        capacity: 2,
        images: ['https://via.placeholder.com/400x300?text=Standard+Room'],
        isAvailable: true,
        roomType: 'standard',
        bedType: 'queen'
      },
      {
        _id: '3',
        name: 'Family Room',
        description: 'Spacious family room perfect for 4 guests',
        price: 100000,
        capacity: 4,
        images: ['https://via.placeholder.com/400x300?text=Family+Room'],
        isAvailable: true,
        roomType: 'family',
        bedType: 'twin'
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRooms: 3
    }
  });
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  
  // Mock validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    message: 'User registered successfully',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'user-' + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      role: 'user'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  res.json({
    message: 'Login successful',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'user-' + Date.now(),
      firstName: 'Test',
      lastName: 'User',
      email,
      role: 'user'
    }
  });
});

// Password reset endpoints
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  console.log(`Password reset requested for: ${email}`);
  console.log('Use code: 123456 for testing');
  
  res.json({
    message: 'If an account with this email exists, a password reset code has been sent.'
  });
});

app.post('/api/auth/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }
  
  if (code === '123456') {
    res.json({
      message: 'Reset code verified successfully',
      verified: true
    });
  } else {
    res.status(400).json({ error: 'Invalid or expired reset code' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (code === '123456') {
    res.json({
      message: 'Password reset successfully'
    });
  } else {
    res.status(400).json({ error: 'Invalid or expired reset code' });
  }
});

// Admin login
app.post('/api/auth/admin/login', (req, res) => {
  const { adminKey } = req.body;
  
  if (adminKey === process.env.ADMIN_KEY || adminKey === 'admin123456') {
    res.json({
      message: 'Admin login successful',
      token: 'admin-jwt-token-' + Date.now(),
      user: {
        id: 'admin-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@franchotel.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid admin key' });
  }
});

// Mock booking endpoint
app.post('/api/bookings', (req, res) => {
  const { roomIds, checkIn, checkOut, guestInfo, numberOfGuests } = req.body;
  
  // Mock validation
  if (!roomIds || !checkIn || !checkOut || !guestInfo) {
    return res.status(400).json({ error: 'Missing required booking information' });
  }
  
  const booking = {
    _id: 'booking-' + Date.now(),
    bookingNumber: 'BK' + Date.now(),
    rooms: roomIds,
    checkIn,
    checkOut,
    guestInfo,
    numberOfGuests,
    status: 'pending',
    totalPrice: 75000,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Booking created successfully',
    booking
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
  console.log('🚀 Hotel Booking Server is running!');
  console.log('📍 Port:', PORT);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔗 API URL: http://localhost:' + PORT + '/api');
  console.log('❤️  Health Check: http://localhost:' + PORT + '/api/health');
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('- Admin Key: admin123456');
  console.log('- Password Reset Code: 123456');
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('- GET  /api/health');
  console.log('- GET  /api/rooms');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/forgot-password');
  console.log('- POST /api/auth/verify-reset-code');
  console.log('- POST /api/auth/reset-password');
  console.log('- POST /api/auth/admin/login');
  console.log('- POST /api/bookings');
});
