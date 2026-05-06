import express from 'express';
import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import auth, { adminAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Create new booking (supports both authenticated and guest users)
router.post('/', optionalAuth, [
  body('roomId').isMongoId().withMessage('Valid room ID is required'),
  body('checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').isISO8601().withMessage('Invalid check-out date'),
  body('numberOfGuests').isInt({ min: 1, max: 10 }).withMessage('Number of guests must be between 1 and 10'),
  body('hasPets').isBoolean().withMessage('Pet selection is required'),
  // Guest info for unauthenticated users
  body('guestInfo').optional().isObject().withMessage('Guest information must be an object'),
  body('guestInfo.firstName').optional().trim().isLength({ min: 2 }).withMessage('First name is required'),
  body('guestInfo.lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name is required'),
  body('guestInfo.email').optional().isEmail().withMessage('Valid email is required'),
  body('guestInfo.phone').optional().trim().notEmpty().withMessage('Phone number is required'),
  // Account creation option
  body('createAccount').optional().isBoolean().withMessage('Create account must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId, checkIn, checkOut, numberOfGuests, hasPets, guestInfo, createAccount } = req.body;
    const user = req.user; // This comes from optionalAuth middleware
    
    // Debug logging to check authentication
    console.log('Booking request - user:', user ? user.email : 'No user authenticated');

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is active
    if (!room.isActive) {
      return res.status(400).json({ error: 'Room is not available for booking' });
    }

    // Check pet policy
    if (hasPets && !room.petFriendly) {
      return res.status(400).json({ error: 'This room does not allow pets' });
    }

    // Check guest capacity
    if (numberOfGuests > room.capacity) {
      return res.status(400).json({ 
        error: `This room can only accommodate ${room.capacity} guests. You selected ${numberOfGuests} guests.` 
      });
    }

    // Check room availability for dates
    const isAvailable = room.isAvailableForDates(checkIn, checkOut);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Room is not available for the selected dates' });
    }

    // Calculate total cost
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalCost = room.price * nights;

    // Handle guest user account creation
    let bookingUser = user;
    let accountCreated = null;
    
    if (!user && guestInfo && createAccount) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: guestInfo.email });
      
      if (existingUser) {
        // User already exists, use existing user
        bookingUser = existingUser;
      } else {
        // Generate random password
        const password = Math.random().toString(36).slice(-8);
        
        const newUser = new User({
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone,
          password, // Will be hashed by pre-save hook
          role: 'user'
        });

        await newUser.save();
        bookingUser = newUser;
        accountCreated = {
          email: newUser.email,
          password: password
        };
      }
    }

    // Create booking
    const bookingData = {
      rooms: [{
        room: roomId,
        roomName: room.name,
        roomPrice: room.price
      }],
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      numberOfGuests: {
        adults: numberOfGuests || 1,
        children: 0
      },
      hasPets,
      totalCost,
      nights,
      totalPrice: totalCost,
      status: 'pending'
    };

    if (bookingUser) {
      bookingData.user = bookingUser._id;
      bookingData.guestInfo = {
        firstName: bookingUser.firstName,
        lastName: bookingUser.lastName,
        email: bookingUser.email,
        phone: bookingUser.phone
      };
    } else if (guestInfo) {
      bookingData.guestInfo = guestInfo;
    } else {
      return res.status(400).json({ error: 'Guest information is required for unauthenticated bookings' });
    }

    // Create and save booking
    const booking = new Booking(bookingData);
    await booking.save();

    // Block room dates
    await room.blockDates(checkIn, checkOut, 'booking');

    // Add booking to room
    room.bookings.push(booking._id);
    await room.save();

    // Transform booking for response
    const transformedBooking = {
      ...booking.toObject(),
      id: booking._id.toString(),
      rooms: booking.rooms.map(r => ({
        ...r.toObject(),
        room: {
          _id: room._id,
          name: room.name,
          price: room.price,
          images: room.images,
          capacity: room.capacity,
          petFriendly: room.petFriendly,
          amenities: room.amenities
        }
      }))
    };

    const response = {
      message: 'Booking created successfully',
      booking: transformedBooking,
      totalCost,
      nights
    };

    // Include account creation info if account was created
    if (accountCreated) {
      response.accountCreated = accountCreated;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    const query = { user: req.user._id };

    if (status) query.status = status;
    if (startDate && endDate) {
      query.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('rooms.room', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBookings: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('rooms.room', 'name images price amenities')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Update booking (user can update limited fields)
router.put('/:id', auth, [
  body('guestInfo.specialRequests').optional().trim().isLength({ max: 500 }),
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow updates if booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot update confirmed booking' });
    }

    const allowedUpdates = ['guestInfo.specialRequests', 'notes'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        ...updates,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('rooms.room', 'name images price');

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, [
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Cancel booking
    await booking.cancel(req.body.reason || 'Cancelled by user', req.user._id);

    // Unblock room dates
    for (const roomBooking of booking.rooms) {
      const room = await Room.findById(roomBooking.room);
      if (room) {
        await room.unblockDates(booking.checkIn, booking.checkOut);
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get all bookings (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (startDate && endDate) {
      query.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      query.$or = [
        { 'guestInfo.email': { $regex: search, $options: 'i' } },
        { 'guestInfo.firstName': { $regex: search, $options: 'i' } },
        { 'guestInfo.lastName': { $regex: search, $options: 'i' } },
        { bookingNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('user', 'firstName lastName email')
      .populate('rooms.room', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    // Transform bookings to include id field
    const transformedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      id: booking._id.toString(),
      totalPrice: booking.totalCost
    }));

    res.json({
      bookings: transformedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBookings: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status (admin only)
router.put('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking.updatedBy = req.user._id;

    if (status === 'confirmed') {
      booking.confirmedAt = new Date();
    } else if (status === 'cancelled') {
      booking.cancellationReason = reason || 'Cancelled by admin';
      booking.cancelledAt = new Date();
      
      // Unblock room dates
      for (const roomBooking of booking.rooms) {
        const room = await Room.findById(roomBooking.room);
        if (room) {
          await room.unblockDates(booking.checkIn, booking.checkOut);
        }
      }
    }

    await booking.save();

    res.json({
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get booking statistics (admin only)
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

export default router;
