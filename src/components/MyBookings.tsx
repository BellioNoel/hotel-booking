// src/components/MyBookings.tsx
import { useState, useEffect } from 'react';
import { bookingsAPI, handleAPIRequest } from '../lib/api';
import { useTempAuth } from '../hooks/useTempAuth';
import { Calendar, Clock, MapPin, Users, DollarSign, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">Manage your hotel reservations</p>
            </div>
            <button
              onClick={loadBookings}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">You haven't made any reservations yet.</p>
            <a
              href="/booking"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Room</span>
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  {/* Booking Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Booking #{booking.bookingNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium text-gray-900">{booking.nights} nights</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Total Price</p>
                        <p className="text-sm font-medium text-gray-900">
                          FCFA {booking.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rooms */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Rooms</h4>
                    <div className="space-y-2">
                      {booking.rooms.map((room, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {room.room?.images?.[0] && (
                            <img
                              src={room.room.images[0].url}
                              alt={room.roomName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{room.roomName}</p>
                            <p className="text-xs text-gray-500">
                              FCFA {room.roomPrice.toLocaleString()} per night
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Guest Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 text-gray-900">
                          {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 text-gray-900">{booking.guestInfo.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2 text-gray-900">{booking.guestInfo.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
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
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
