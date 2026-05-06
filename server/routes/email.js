import express from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import auth, { adminAuth } from '../middleware/auth.js';
import generateBookingReceiptTemplate from '../bookingReceiptTemplate.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send booking confirmation email
router.post('/booking-confirmation', auth, [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('guestEmail').isEmail().withMessage('Valid guest email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { bookingId, guestEmail } = req.body;

    // In a real implementation, you would fetch the booking details from the database
    // For now, we'll send a confirmation email with basic details

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Franc Hotel" <${process.env.EMAIL_USER}>`,
      to: guestEmail,
      subject: 'Booking Confirmation - Franc Hotel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Franc Hotel</h1>
            <p>Booking Confirmation</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2>Booking Details</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p>Thank you for choosing Franc Hotel. Your booking has been received and is currently being processed.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Next Steps:</h3>
              <ul>
                <li>We will review your booking within 24 hours</li>
                <li>You will receive a confirmation email once your booking is approved</li>
                <li>For any inquiries, please contact us at support@franchotel.com</li>
              </ul>
            </div>
            
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

    res.json({
      message: 'Booking confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Send booking confirmation email error:', error);
    res.status(500).json({ error: 'Failed to send booking confirmation email' });
  }
});

// Send booking status update email
router.post('/booking-status', auth, [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('guestEmail').isEmail().withMessage('Valid guest email is required'),
  body('status').isIn(['confirmed', 'cancelled', 'rejected']).withMessage('Invalid status'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { bookingId, guestEmail, status, subject, message } = req.body;

    const transporter = createTransporter();

    const statusColors = {
      confirmed: '#10b981',
      cancelled: '#f59e0b',
      rejected: '#ef4444'
    };

    const mailOptions = {
      from: `"Franc Hotel" <${process.env.EMAIL_USER}>`,
      to: guestEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Franc Hotel</h1>
            <p>Booking Status Update</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <div style="background-color: ${statusColors[status]}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
              <p style="margin: 5px 0 0 0;">Booking ID: ${bookingId}</p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px;">
              <h3>Message from Franc Hotel:</h3>
              <p style="line-height: 1.6;">${message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p>If you have any questions, please don't hesitate to contact us:</p>
              <p>Email: support@franchotel.com | Phone: +237 670 776 116</p>
            </div>
          </div>
          
          <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Franc Hotel. All rights reserved.</p>
            <p>Bonaberi, Douala, Cameroon</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Booking status email sent successfully'
    });

  } catch (error) {
    console.error('Send booking status email error:', error);
    res.status(500).json({ error: 'Failed to send booking status email' });
  }
});

// Send contact form email
router.post('/contact', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject is required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    const transporter = createTransporter();

    // Send to hotel admin
    const adminMailOptions = {
      from: `"Franc Hotel Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to admin
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `
    };

    // Send confirmation to user
    const userMailOptions = {
      from: `"Franc Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting Franc Hotel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Franc Hotel</h1>
            <p>Thank you for contacting us</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to Franc Hotel. We have received your message and will get back to you within 24 hours.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Message:</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p>${message}</p>
            </div>
            
            <p>If you have any urgent inquiries, please call us at +237 670 776 116.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p>Best regards,<br>The Franc Hotel Team</p>
            </div>
          </div>
          
          <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Franc Hotel. All rights reserved.</p>
            <p>Bonaberi, Douala, Cameroon</p>
          </div>
        </div>
      `
    };

    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.json({
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    console.error('Send contact email error:', error);
    res.status(500).json({ error: 'Failed to send contact email' });
  }
});

// Send password reset email
router.post('/password-reset', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('resetCode').notEmpty().withMessage('Reset code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, resetCode } = req.body;

    const transporter = createTransporter();

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

    res.json({
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Send password reset email error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

// Test email configuration (admin only)
router.post('/test', adminAuth, async (req, res) => {
  try {
    const transporter = createTransporter();

    await transporter.verify();

    const testMailOptions = {
      from: `"Franc Hotel Test" <${process.env.EMAIL_USER}>`,
      to: req.user.email,
      subject: 'Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Configuration Test Successful</h2>
          <p>This is a test email to confirm that the email system is working correctly.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await transporter.sendMail(testMailOptions);

    res.json({
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

// Send booking receipt email
router.post('/send-booking-receipt', async (req, res) => {
  try {
    const { to, subject, data } = req.body;
    
    if (!to || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare data for the template
    const templateData = {
      hotel: {
        name: "Franc Hotel",
        phone: "+237 678959867",
        email: "franchotel.home@gmail.com",
        website: "https://frachotel.com",
        location: "Bonaberi, Douala, Cameroon"
      },
      poweredBy: {
        name: "Brightstack Innovations",
        website: "https://brightstackinnovations.com",
        email: "brightstackinnovations@gmail.com",
        phone: "+237 678507737",
        rights: "All rights reserved @2026"
      },
      booking: {
        confirmationCode: `#${data.bookingId}`,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guestName: data.guestName,
        guestCount: `${data.numberOfGuests || 2} Adults`,
        roomNumber: data.roomNumber || "TBA",
        duration: `${data.nights} Night${data.nights > 1 ? 's' : ''}`,
        pricePerNight: data.roomPrice || "TBA",
        totalPrice: data.totalCost,
        roomType: data.roomType || "Standard",
        bedType: data.bedType || "Queen",
        capacity: `${data.capacity || 2} Guests`,
        size: data.roomSize || "25m²",
        petFriendly: data.hasPets ? "Yes" : "No"
      }
    };

    console.log('Using new booking receipt template...');
    const htmlContent = generateBookingReceiptTemplate(templateData);
    console.log('Template generated successfully');

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Franco Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Booking receipt email sent successfully' });
  } catch (error) {
    console.error('Send booking receipt error:', error);
    res.status(500).json({ error: 'Failed to send booking receipt email' });
  }
});

// Send booking status email
router.post('/send-booking-status', async (req, res) => {
  try {
    const { to, subject, data } = req.body;
    
    if (!to || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const statusColor = data.status === 'accepted' ? '#16a34a' : '#dc2626';
    const statusText = data.status === 'accepted' ? 'Accepted' : 'Rejected';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Status Update - Franco Hotel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ${statusColor}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking ${statusText}</h1>
            <p>Franco Hotel - Your booking status has been updated</p>
          </div>
          <div class="content">
            <p>Dear ${data.guestName},</p>
            
            <div class="status-box">
              <h3>Booking Status: ${statusText}</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Check-in:</strong> ${data.checkIn}</p>
              <p><strong>Check-out:</strong> ${data.checkOut}</p>
            </div>
            
            <p>${data.message}</p>
          </div>
          <div class="footer">
            <p>Franco Hotel | Your Address Here | Your Phone Here</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Franco Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Booking status email sent successfully' });
  } catch (error) {
    console.error('Send booking status error:', error);
    res.status(500).json({ error: 'Failed to send booking status email' });
  }
});

// Send account creation email
router.post('/send-account-creation', async (req, res) => {
  try {
    const { to, subject, data } = req.body;
    
    if (!to || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Created - Franco Hotel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .credentials { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 2px dashed #1e40af; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Created</h1>
            <p>Franco Hotel - Your account has been created</p>
          </div>
          <div class="content">
            <p>Dear Guest,</p>
            <p>Your account has been successfully created at Franco Hotel. Here are your login credentials:</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${data.tempPassword}</code></p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            <p>You can now log in to your account to manage your bookings and personal information.</p>
            
            <p><a href="${data.loginUrl}" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a></p>
          </div>
          <div class="footer">
            <p>Franco Hotel | Your Address Here | Your Phone Here</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Franco Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Account creation email sent successfully' });
  } catch (error) {
    console.error('Send account creation error:', error);
    res.status(500).json({ error: 'Failed to send account creation email' });
  }
});

// Send password reset email
router.post('/send-password-reset', async (req, res) => {
  try {
    const { to, subject, data } = req.body;
    
    if (!to || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - Franco Hotel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reset-button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p>Franco Hotel - Reset your password</p>
          </div>
          <div class="content">
            <p>Dear User,</p>
            <p>You have requested to reset your password for your Franco Hotel account.</p>
            
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour for security reasons.</li>
              <li>If you didn't request this password reset, please ignore this email.</li>
            </ul>
          </div>
          <div class="footer">
            <p>Franco Hotel | Your Address Here | Your Phone Here</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Franco Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Send password reset error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

export default router;
