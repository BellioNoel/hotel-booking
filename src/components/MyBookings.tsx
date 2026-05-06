// src/components/MyBookings.tsx
import { useState, useEffect } from 'react';
import { bookingsAPI, handleAPIRequest } from '../lib/api';
import { useTempAuth } from '../hooks/useTempAuth';
import { Calendar, Clock, Users, DollarSign, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

interface Booking {
  _id: string;
  bookingNumber: string;
  rooms: Array<{
    room: {
      name: string;
      images: string[];
    };
    roomName: string;
    roomPrice: number;
  }>;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  createdAt: string;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle temporary authentication for newly created accounts
  useTempAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await handleAPIRequest(() => bookingsAPI.getMyBookings());
      if (data) {
        setBookings(data.bookings);
      } else {
        setError(error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('An error occurred while loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    
    try {
      const { data, error } = await handleAPIRequest(() => bookingsAPI.cancelBooking(bookingId, 'Cancelled by user'));
      if (data) {
        await loadBookings(); // Refresh the list
      } else {
        setError(error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('An error occurred while cancelling booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-accent-lime-500/20 text-[#d7f29f] border border-accent-lime-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-200 border border-amber-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-200 border border-red-400/30';
      case 'completed': return 'bg-primary-600/30 text-[#f8f4ef] border border-primary-400/30';
      case 'no-show': return 'bg-white/10 text-[#f8f4ef]/80 border border-white/15';
      default: return 'bg-white/10 text-[#f8f4ef]/80 border border-white/15';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      case 'no-show': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-accent-lime-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] py-8 text-[#f8f4ef]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-white/10 bg-[#2a0e1a]/85 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#f8f4ef]">My Bookings</h1>
              <p className="mt-1 text-[#f8f4ef]/70">Manage your hotel reservations</p>
            </div>
            <button
              onClick={loadBookings}
              className="flex items-center space-x-2 rounded-lg bg-accent-lime-500 px-4 py-2 text-[#2b0818] hover:bg-accent-lime-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#2a0e1a]/85 p-12 text-center shadow-sm">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-[#f8f4ef]/30" />
            <h3 className="mb-2 text-lg font-medium text-[#f8f4ef]">No bookings found</h3>
            <p className="mb-6 text-[#f8f4ef]/65">You haven't made any reservations yet.</p>
            <a
              href="/booking"
              className="inline-flex items-center space-x-2 rounded-lg bg-accent-lime-500 px-4 py-2 text-[#2b0818] hover:bg-accent-lime-300 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Room</span>
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="overflow-hidden rounded-xl border border-white/10 bg-[#2a0e1a]/85 shadow-sm">
                <div className="p-6">
                  {/* Booking Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#f8f4ef]">
                          Booking #{booking.bookingNumber}
                        </h3>
                        <p className="text-sm text-[#f8f4ef]/60">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-[#f8f4ef]/45" />
                      <div>
                        <p className="text-xs text-[#f8f4ef]/60">Check-in</p>
                        <p className="text-sm font-medium text-[#f8f4ef]">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-[#f8f4ef]/45" />
                      <div>
                        <p className="text-xs text-[#f8f4ef]/60">Check-out</p>
                        <p className="text-sm font-medium text-[#f8f4ef]">
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-[#f8f4ef]/45" />
                      <div>
                        <p className="text-xs text-[#f8f4ef]/60">Duration</p>
                        <p className="text-sm font-medium text-[#f8f4ef]">{booking.nights} nights</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-[#f8f4ef]/45" />
                      <div>
                        <p className="text-xs text-[#f8f4ef]/60">Total Price</p>
                        <p className="text-sm font-medium text-[#f8f4ef]">
                          FCFA {booking.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rooms */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium text-[#f8f4ef]">Rooms</h4>
                    <div className="space-y-2">
                      {booking.rooms.map((room, index) => {
                        const roomObj = typeof room.room === 'object' ? room.room : null;
                        let imageUrl: string | null = null;
                        if (roomObj?.images?.[0]) {
                          const img = roomObj.images[0] as any;
                          imageUrl = typeof img === 'string' ? img : (img?.url || null);
                        }
                        return (
                          <div key={index} className="flex items-center space-x-3 rounded-lg border border-white/10 bg-white/5 p-3">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={room.roomName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#f8f4ef]">{room.roomName}</p>
                              <p className="text-xs text-[#f8f4ef]/60">
                                FCFA {room.roomPrice.toLocaleString()} per night
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-2 text-sm font-medium text-[#f8f4ef]">Guest Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#f8f4ef]/60">Name:</span>
                        <span className="ml-2 text-[#f8f4ef]">
                          {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#f8f4ef]/60">Email:</span>
                        <span className="ml-2 text-[#f8f4ef]">{booking.guestInfo.email}</span>
                      </div>
                      <div>
                        <span className="text-[#f8f4ef]/60">Phone:</span>
                        <span className="ml-2 text-[#f8f4ef]">{booking.guestInfo.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#f8f4ef]/65">
                      {booking.status === 'pending' && 'Your booking is awaiting confirmation.'}
                      {booking.status === 'confirmed' && 'Your booking is confirmed. We look forward to your stay!'}
                      {booking.status === 'cancelled' && 'This booking has been cancelled.'}
                      {booking.status === 'completed' && 'Thank you for your stay!'}
                      {booking.status === 'no-show' && 'This booking was marked as no-show.'}
                    </div>
                    
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking._id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Booking'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
