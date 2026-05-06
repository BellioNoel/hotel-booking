import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import auth, { adminAuth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Check if email exists
router.post('/check-email', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// Register new user
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        bookings: user.bookings,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, phone } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account with this email exists, a password reset code has been sent.'
      });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = resetCodeExpires;
    await user.save();

    // Send email with reset code (you'll need to implement email sending)
    // For now, we'll just return the code in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset code:', resetCode);
    }

    // Send email with reset code
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Franc Hotel" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Code - Franc Hotel',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1>Franc Hotel</h1>
              <p>Password Reset Code</p>
            </div>
            
            <div style="padding: 20px; background-color: #f9fafb;">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password for your Franc Hotel account.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0;">Your Reset Code:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px; background-color: #f3f4f6; padding: 15px; border-radius: 4px;">
                  ${resetCode}
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                </p>
              </div>
              
              <p>If you didn't request this password reset, please ignore this email.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p>Best regards,<br>The Franc Hotel Team</p>
              </div>
            </div>
            
            <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>&copy; 2024 Franc Hotel. All rights reserved.</p>
              <p>Bonaberi, Douala, Cameroon | Phone: +237 670 776 116</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails - user can still see code in development
    }

    res.json({
      message: 'If an account with this email exists, a password reset code has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset code
router.post('/verify-reset-code', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, code } = req.body;

    const user = await User.findOne({ 
      email, 
      isActive: true,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    res.json({
      message: 'Reset code verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Failed to verify reset code' });
  }
});

// Reset password with code
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ 
      email, 
      isActive: true,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Admin login (simple key-based for now)
router.post('/admin/login', [
  body('adminKey').notEmpty().withMessage('Admin key is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { adminKey } = req.body;
    
    // Use admin key from environment - no fallback for security
    const VALID_ADMIN_KEY = process.env.ADMIN_KEY;
    
    if (!VALID_ADMIN_KEY) {
      console.error('❌ ADMIN_KEY not configured in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (adminKey !== VALID_ADMIN_KEY) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hotel.com',
        password: 'admin123456', // Change this in production!
        phone: '+1234567890',
        role: 'admin'
      });
      await adminUser.save();
    }

    // Generate token
    const token = generateToken(adminUser._id);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to login as admin' });
  }
});

export default router;
