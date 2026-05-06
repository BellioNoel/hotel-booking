import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isRegisteredUser;
    }
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isRegisteredUser: {
    type: Boolean,
    required: true,
    default: false
  },
  guestName: {
    type: String,
    trim: true,
    required: function() {
      return !this.isRegisteredUser;
    }
  },
  guestEmail: {
    type: String,
    trim: true,
    required: function() {
      return !this.isRegisteredUser;
    }
  }
}, {
  timestamps: true
});

// Ensure one review per user per room
reviewSchema.index({ user: 1, room: 1 }, { unique: true });

// Update room rating when review is saved
reviewSchema.post('save', async function() {
  try {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.room);
    if (room) {
      await room.updateRating();
    }
  } catch (error) {
    console.error('Error updating room rating:', error);
  }
});

// Update room rating when review is removed
reviewSchema.post('remove', async function() {
  try {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.room);
    if (room) {
      await room.updateRating();
    }
  } catch (error) {
    console.error('Error updating room rating:', error);
  }
});

export default mongoose.model('Review', reviewSchema);
