import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  rooms: [{
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    roomName: {
      type: String,
      required: true
    },
    roomPrice: {
      type: Number,
      required: true
    }
  }],
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required']
  },
  nights: {
    type: Number,
    required: true,
    min: [1, 'Minimum stay is 1 night']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  guestInfo: {
    firstName: {
      type: String,
      required: [true, 'Guest first name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Guest last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Guest email is required'],
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Guest phone is required'],
      trim: true
    },
    specialRequests: {
      type: String,
      maxlength: [500, 'Special requests cannot exceed 500 characters']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'online'],
    default: 'cash'
  },
  numberOfGuests: {
    adults: {
      type: Number,
      required: true,
      min: [1, 'At least 1 adult is required'],
      max: [10, 'Cannot exceed 10 adults']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children cannot be negative'],
      max: [10, 'Cannot exceed 10 children']
    }
  },
  totalGuests: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledAt: Date,
  confirmedAt: Date,
  checkedInAt: Date,
  checkedOutAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ 'guestInfo.email': 1 });
bookingSchema.index({ createdAt: -1 });

// Validation for dates
bookingSchema.pre('validate', function(next) {
  if (this.checkIn >= this.checkOut) {
    next(new Error('Check-out date must be after check-in date'));
  } else if (this.checkIn < new Date().setHours(0,0,0,0)) {
    next(new Error('Check-in date cannot be in the past'));
  } else {
    // Calculate nights
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    this.nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Calculate total guests
    this.totalGuests = this.numberOfGuests.adults + this.numberOfGuests.children;
    
    next();
  }
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const bookingNumber = 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      const existing = await this.constructor.findOne({ bookingNumber });
      
      if (!existing) {
        this.bookingNumber = bookingNumber;
        isUnique = true;
      }
      attempts++;
    }
  }
  next();
});

// Method to confirm booking
bookingSchema.methods.confirm = function(confirmedBy) {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.updatedBy = confirmedBy;
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.updatedBy = cancelledBy;
  return this.save();
};

// Method to check-in
bookingSchema.methods.performCheckIn = function() {
  this.status = 'completed';
  this.checkedInAt = new Date();
  return this.save();
};

// Method to check-out
bookingSchema.methods.performCheckOut = function() {
  this.checkedOutAt = new Date();
  return this.save();
};

export default mongoose.model('Booking', bookingSchema);
