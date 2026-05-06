import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Room description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Room price is required'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [10, 'Capacity cannot exceed 10']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Room image'
    },
    description: {
      type: String,
      default: ''
    }
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  size: {
    type: Number, // in square meters
    min: [1, 'Size must be at least 1 sq meter']
  },
  bedType: {
    type: String,
    enum: ['single', 'double', 'queen', 'king', 'twin'],
    required: [true, 'Bed type is required']
  },
  roomType: {
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'family'],
    default: 'standard'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  floor: {
    type: Number,
    min: [0, 'Floor cannot be negative']
  },
  view: {
    type: String,
    enum: ['city', 'garden', 'pool', 'mountain', 'street'],
    default: 'city'
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  petFriendly: {
    type: Boolean,
    default: false
  },
  criteria: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  unavailableDates: [{
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['booking', 'maintenance', 'blocked'],
      default: 'booking'
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
roomSchema.index({ name: 1 });
roomSchema.index({ price: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ isActive: 1, isAvailable: 1 });

// Method to check if room is available for given dates
roomSchema.methods.isAvailableForDates = function(checkIn, checkOut) {
  const requestedStart = new Date(checkIn);
  const requestedEnd = new Date(checkOut);
  
  return !this.unavailableDates.some(blocked => {
    const blockedStart = new Date(blocked.start);
    const blockedEnd = new Date(blocked.end);
    
    return (
      (requestedStart >= blockedStart && requestedStart < blockedEnd) ||
      (requestedEnd > blockedStart && requestedEnd <= blockedEnd) ||
      (requestedStart <= blockedStart && requestedEnd >= blockedEnd)
    );
  });
};

// Method to update room rating based on reviews
roomSchema.methods.updateRating = async function() {
  try {
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ room: this._id });
    
    if (reviews.length === 0) {
      this.rating = {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    } else {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / reviews.length;
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        distribution[review.rating]++;
      });
      
      this.rating = {
        average: Math.round(average * 10) / 10, // Round to 1 decimal place
        count: reviews.length,
        distribution
      };
    }
    
    await this.save();
  } catch (error) {
    console.error('Error updating room rating:', error);
  }
};

// Method to block dates for booking
roomSchema.methods.blockDates = function(checkIn, checkOut, reason = 'booking') {
  this.unavailableDates.push({
    start: new Date(checkIn),
    end: new Date(checkOut),
    reason
  });
  return this.save();
};

// Method to unblock dates
roomSchema.methods.unblockDates = function(checkIn, checkOut) {
  this.unavailableDates = this.unavailableDates.filter(blocked => {
    const blockedStart = new Date(blocked.start);
    const blockedEnd = new Date(blocked.end);
    const requestedStart = new Date(checkIn);
    const requestedEnd = new Date(checkOut);
    
    return !(
      blockedStart.getTime() === requestedStart.getTime() &&
      blockedEnd.getTime() === requestedEnd.getTime()
    );
  });
  return this.save();
};

export default mongoose.model('Room', roomSchema);
