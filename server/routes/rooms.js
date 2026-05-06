import express from 'express';
import { body, validationResult } from 'express-validator';
import Room from '../models/Room.js';
import auth, { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      roomType,
      minPrice,
      maxPrice,
      capacity,
      available,
      checkIn,
      checkOut
    } = req.query;

    const query = { isActive: true };

    // Add filters
    if (roomType) query.roomType = roomType;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Availability filter
    if (available === 'true' && checkIn && checkOut) {
      // Find rooms that are available for the given dates
      const unavailableRooms = await Room.find({
        'unavailableDates': {
          $elemMatch: {
            start: { $lt: new Date(checkOut) },
            end: { $gt: new Date(checkIn) }
          }
        }
      }).distinct('_id');

      query._id = { $nin: unavailableRooms };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rooms = await Room.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Room.countDocuments(query);

    // Transform _id to id for frontend compatibility
    const transformedRooms = rooms.map(room => ({
      ...room.toObject(),
      id: room._id.toString()
    }));

    res.json({
      rooms: transformedRooms,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRooms: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedRoom = {
      ...room.toObject(),
      id: room._id.toString()
    };

    res.json({ room: transformedRoom });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create new room (admin only)
router.post('/', adminAuth, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Room name must be 2-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('capacity').isInt({ min: 1, max: 10 }).withMessage('Capacity must be 1-10'),
  body('bedType').isIn(['single', 'double', 'queen', 'king', 'twin']).withMessage('Invalid bed type'),
  body('roomType').optional().isIn(['standard', 'deluxe', 'suite', 'family']).withMessage('Invalid room type'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*.url').optional().isURL().withMessage('Image URL must be valid'),
  body('images.*.publicId').optional().isString().withMessage('Image publicId must be a string'),
  body('images.*.description').optional().isString().withMessage('Image description must be a string'),
  body('criteria').optional().isArray().withMessage('Criteria must be an array'),
  body('criteria.*.name').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Criteria name must be 1-50 characters'),
  body('criteria.*.description').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Criteria description must be 1-200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Room creation validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const roomData = {
      ...req.body,
      createdBy: req.user._id
    };

    console.log('Room data being saved:', JSON.stringify(roomData, null, 2));

    const room = new Room(roomData);
    await room.save();

    // Transform _id to id for frontend compatibility
    const transformedRoom = {
      ...room.toObject(),
      id: room._id.toString()
    };

    res.status(201).json({
      message: 'Room created successfully',
      room: transformedRoom
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room (admin only)
router.put('/:id', adminAuth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('capacity').optional().isInt({ min: 1, max: 10 }),
  body('bedType').optional().isIn(['single', 'double', 'queen', 'king', 'twin']),
  body('roomType').optional().isIn(['standard', 'deluxe', 'suite', 'family'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedRoom = {
      ...room.toObject(),
      id: room._id.toString()
    };

    res.json({
      message: 'Room updated successfully',
      room: transformedRoom
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Add images to room (admin only)
router.post('/:id/images', adminAuth, [
  body('images').isArray().withMessage('Images must be an array'),
  body('images.*.url').isURL().withMessage('Image URL must be valid'),
  body('images.*.publicId').notEmpty().withMessage('Image public ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.images.push(...req.body.images);
    await room.save();

    res.json({
      message: 'Images added successfully',
      images: room.images
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(500).json({ error: 'Failed to add images' });
  }
});

// Remove image from room (admin only)
router.delete('/:id/images/:publicId', adminAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.images = room.images.filter(img => img.publicId !== req.params.publicId);
    await room.save();

    res.json({
      message: 'Image removed successfully',
      images: room.images
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// Check room availability for specific dates
router.get('/:id/availability', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }

    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isAvailable = room.isAvailableForDates(checkIn, checkOut);

    res.json({
      roomId: room._id,
      roomName: room.name,
      isAvailable,
      checkIn,
      checkOut,
      unavailableDates: room.unavailableDates
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get room types (for filters)
router.get('/types/list', async (req, res) => {
  try {
    const roomTypes = await Room.distinct('roomType', { isActive: true });
    res.json({ roomTypes });
  } catch (error) {
    console.error('Get room types error:', error);
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

export default router;
