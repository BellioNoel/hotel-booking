import express from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Room from '../models/Room.js';
import auth, { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a room (public)
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ room: roomId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ room: roomId });
    
    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review (authenticated or guest)
router.post('/', [
  body('roomId').isMongoId().withMessage('Valid room ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
  body('guestName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Guest name is required for non-registered users'),
  body('guestEmail').optional().isEmail().withMessage('Valid guest email is required for non-registered users')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { roomId, rating, comment, guestName, guestEmail } = req.body;
    const user = req.user;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user already reviewed this room
    if (user) {
      const existingReview = await Review.findOne({ user: user._id, room: roomId });
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this room' });
      }
    }

    // Create review
    const reviewData = {
      room: roomId,
      rating,
      comment,
      isRegisteredUser: !!user
    };

    if (user) {
      reviewData.user = user._id;
    } else {
      reviewData.guestName = guestName;
      reviewData.guestEmail = guestEmail;
    }

    const review = new Review(reviewData);
    await review.save();

    // Populate user data if registered
    await review.populate('user', 'name email');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this room' });
    }
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review (only registered users)
router.put('/:id', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    const review = await Review.findOne({ _id: id, user: user._id });
    if (!review) {
      return res.status(404).json({ error: 'Review not found or you do not have permission to update it' });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await review.populate('user', 'name email');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review (only registered users)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const review = await Review.findOne({ _id: id, user: user._id });
    if (!review) {
      return res.status(404).json({ error: 'Review not found or you do not have permission to delete it' });
    }

    await review.remove();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
