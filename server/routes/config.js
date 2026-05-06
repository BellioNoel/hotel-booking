import express from 'express';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get about page configuration
router.get('/about-page', async (req, res) => {
  try {
    // For now, return default data. In a real app, this would come from a database
    const defaultData = {
      hero: {
        id: 'hero',
        title: 'Welcome to Franco Hotel',
        description: 'Experience luxury and comfort in the heart of the city',
        image: ''
      },
      cards: [
        {
          id: 'card1',
          title: 'Luxury Rooms',
          description: 'Spacious and elegantly furnished rooms with modern amenities',
          image: ''
        },
        {
          id: 'card2',
          title: 'Fine Dining',
          description: 'Exceptional cuisine prepared by our world-class chefs',
          image: ''
        },
        {
          id: 'card3',
          title: 'Wellness & Spa',
          description: 'Relax and rejuvenate with our premium spa services',
          image: ''
        }
      ]
    };

    res.json(defaultData);
  } catch (error) {
    console.error('Get about page error:', error);
    res.status(500).json({ error: 'Failed to get about page data' });
  }
});

// Update about page configuration
router.put('/about-page', adminAuth, async (req, res) => {
  try {
    const { hero, cards } = req.body;

    // Validate input
    if (!hero || !cards) {
      return res.status(400).json({ error: 'Hero and cards are required' });
    }

    // For now, just return success. In a real app, this would save to a database
    const updatedData = { hero, cards };

    res.json({
      message: 'About page updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Update about page error:', error);
    res.status(500).json({ error: 'Failed to update about page' });
  }
});

export default router;
