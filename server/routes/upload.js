import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import auth, { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Function to configure Cloudinary
function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image to Cloudinary
router.post('/image', adminAuth, upload.single('image'), async (req, res) => {
  try {
    // Configure Cloudinary with current environment variables
    configureCloudinary();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'hotel-booking',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          transformation: [
            { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'Image uploaded successfully',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });

  } catch (error) {
    console.error('Upload image error:', error.message);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
});

// Upload multiple images
router.post('/images', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    // Configure Cloudinary with current environment variables
    configureCloudinary();
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map(file => 
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'hotel-booking',
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            transformation: [
              { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format
            });
          }
        ).end(file.buffer);
      })
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      message: `${results.length} images uploaded successfully`,
      images: results
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete image from Cloudinary
router.delete('/image/:publicId', adminAuth, async (req, res) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    res.json({
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Get image info
router.get('/image/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await cloudinary.api.resource(publicId);

    res.json({
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at
      }
    });

  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({ error: 'Failed to get image info' });
  }
});

export default router;
