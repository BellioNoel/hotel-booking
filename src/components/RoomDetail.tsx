/**
 * src/components/RoomDetail.tsx
 * Detailed room view for candidates with image gallery, criteria, and booking
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Room } from "../types";
import Reviews from "./Reviews";
import BookingSuccessModal from "./BookingSuccessModal";
import { roomsAPI, handleAPIRequest } from "../lib/api";
import { sendBookingReceiptEmail, sendAccountCreationEmail } from "../lib/email";
import { useToast } from "../contexts/ToastContext";

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Booking form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [hasPets, setHasPets] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [nights, setNights] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data, error } = await handleAPIRequest(() => roomsAPI.getRoom(roomId!));
        if (error) {
          console.error('Error fetching room:', error);
          return;
        }
        if (data) {
          // Handle nested room structure - API returns { room: { ... } }
          const roomData = data.room || data;
          setRoom(roomData);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  // Calculate total cost when dates change
  useEffect(() => {
    if (checkIn && checkOut && room) {
      const checkInDate = new Date(checkIn).getTime();
      const checkOutDate = new Date(checkOut).getTime();
      const nightsCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      
      if (nightsCount > 0) {
        setNights(nightsCount);
        setTotalCost(room.price * nightsCount);
      } else {
        setNights(0);
        setTotalCost(0);
      }
    } else {
      setNights(0);
      setTotalCost(0);
    }
  }, [checkIn, checkOut, room]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room) return;
    
    // Validation
    if (!checkIn || !checkOut) {
      showError('Validation Error', 'Please select check-in and check-out dates');
      return;
    }
    
    if (numberOfGuests > room.capacity) {
      showError('Capacity Error', `This room can only accommodate ${room.capacity} guests`);
      return;
    }
    
    if (hasPets && !room.petFriendly) {
      showError('Pet Policy', 'This room does not allow pets');
      return;
    }
    
    // Check if email exists for guest bookings (both with and without account creation)
    if (guestInfo.email) {
      try {
        // Check if user already exists
        const checkResponse = await fetch('http://localhost:5000/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: guestInfo.email })
        });
        
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
          // Email exists, prompt user to login
          showError('Account Exists', 'An account with this email already exists. Please login to continue.');
          
          // Store booking data for after login
          localStorage.setItem('pendingBooking', JSON.stringify({
            roomId: room.id,
            checkIn,
            checkOut,
            numberOfGuests,
            hasPets,
            guestInfo,
            createAccount: false // Don't create account since it exists
          }));
          
          // Redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        // Continue with booking if email check fails
      }
      
      // Show warning for guests not creating account (but continue with booking)
      if (!createAccount) {
        // Show warning but don't stop the booking process
        setTimeout(() => {
          showInfo(
            'Guest Booking Notice',
            'You are booking as a guest. You will not be able to control or modify your booking through our website. All booking details will be sent to your email for reference.'
          );
        }, 100);
      }
    }
    
    // Add guest info for unauthenticated bookings
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      showError('Validation Error', 'Please fill in all guest information');
      return;
    }
    const bookingData: any = {
      roomId: room.id,
      checkIn,
      checkOut,
      numberOfGuests,
      hasPets,
      guestInfo,
      createAccount
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showSuccess('Booking Confirmed!', 'Your room has been booked successfully.');
        
        // Send booking receipt email
        if (room && result.booking) {
          sendBookingReceiptEmail(
            result.booking,
            room.name,
            result.totalCost,
            result.nights
          ).catch(error => {
            console.error('Failed to send booking receipt email:', error);
          });
        }
        
        // Send account creation email if applicable
        if (result.accountCreated) {
          sendAccountCreationEmail(
            result.accountCreated.email,
            result.accountCreated.password
          ).catch(error => {
            console.error('Failed to send account creation email:', error);
          });
        }
        
        // Set booking result and show modal
        setBookingResult(result);
        setShowBookingModal(true);
        
        // Reset form
        setCheckIn('');
        setCheckOut('');
        setNumberOfGuests(1);
        setHasPets(false);
        setCreateAccount(false);
        setGuestInfo({ firstName: '', lastName: '', email: '', phone: '' });
      } else {
        showError('Booking Failed', result.error || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showError('Booking Failed', 'An error occurred while processing your booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent-lime-500"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] text-[#f8f4ef]">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-[#f8f4ef]">Room not found</h2>
          <button
            onClick={() => navigate('/rooms')}
            className="font-medium text-accent-lime-500 hover:text-accent-lime-300"
          >
            Back to rooms
          </button>
        </div>
      </div>
    );
  }

  const priceFormatted = new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(room.price)
    .replace("FCFA", "FCFA");

  const totalPriceFormatted = new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(totalCost)
    .replace("FCFA", "FCFA");

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] text-[#f8f4ef]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#2a0e1a]/85 shadow-sm backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/rooms')}
            className="flex items-center text-[#f8f4ef]/80 hover:text-accent-lime-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to rooms
          </button>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Image Gallery */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#2a0e1a]/85 shadow-lg">
              <div className="aspect-4/3 bg-[#15070d]">
                {room.images && room.images[selectedImageIndex] ? (
                  <img
                    src={room.images[selectedImageIndex].url}
                    alt={room.images[selectedImageIndex].alt || room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#f8f4ef]/40">
                    <span className="text-lg font-medium">No image</span>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {room.images && room.images.length > 1 && (
                <div className="border-t border-white/10 p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {room.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                          selectedImageIndex === index ? 'border-accent-lime-500' : 'border-white/20'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt || `${room.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  
                  {/* Image Description */}
                  {room.images[selectedImageIndex]?.description && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-sm italic text-[#f8f4ef]/75">
                        {room.images[selectedImageIndex].description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Room Information */}
            <div className="rounded-xl border border-white/10 bg-[#2a0e1a]/85 p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-[#f8f4ef]">{room.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-[#f8f4ef]/70">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {room.rating?.average.toFixed(1) || 'N/A'}
                    </span>
                    <span>({room.rating?.count || 0} reviews)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-accent-lime-500">{priceFormatted}</div>
                  <div className="text-sm text-[#f8f4ef]/65">per night</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed text-[#f8f4ef]/80">{room.description || 'No description available'}</p>
              </div>

              {/* Room Criteria */}
              {room.criteria && room.criteria.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-xl font-semibold text-[#f8f4ef]">Room Features & Criteria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {room.criteria.map((criteria, index) => (
                      <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-2 font-semibold text-[#f8f4ef]">{criteria.name}</h4>
                        <p className="text-sm text-[#f8f4ef]/70">{criteria.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Details */}
              <div className="mt-6 rounded-xl border border-white/10 bg-[#230b15] p-6 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold text-[#f8f4ef]">Room Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#f8f4ef]/70">Room Type</span>
                    <span className="font-medium text-[#f8f4ef]">{room.roomType || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f8f4ef]/70">Bed Type</span>
                    <span className="font-medium text-[#f8f4ef]">{room.bedType || 'Double'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f8f4ef]/70">Capacity</span>
                    <span className="font-medium text-[#f8f4ef]">{room.capacity || 2} Guests</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f8f4ef]/70">Size</span>
                    <span className="font-medium text-[#f8f4ef]">{room.size ? `${room.size}m²` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f8f4ef]/70">Pet Friendly</span>
                    <span className="font-medium text-[#f8f4ef]">{room.petFriendly ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-8">
                <Reviews roomId={room.id} roomRating={room.rating} />
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 rounded-xl border border-white/10 bg-[#2a0e1a]/90 p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-[#f8f4ef]">Book This Room</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#f8f4ef]/80">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#f8f4ef]/80">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#f8f4ef]/80">
                    Number of Guests
                  </label>
                  <select 
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                  >
                    {Array.from({ length: room?.capacity || 2 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num} Guest{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  {room && (
                    <p className="mt-1 text-xs text-[#f8f4ef]/60">
                      Max capacity: {room.capacity} guests
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasPets}
                      onChange={(e) => setHasPets(e.target.checked)}
                      className="h-4 w-4 rounded border-white/30 text-accent-lime-500 focus:ring-accent-lime-500"
                      disabled={room && !room.petFriendly}
                    />
                    <span className="ml-2 block text-sm text-[#f8f4ef]/80">
                      I'm traveling with pets
                    </span>
                  </label>
                  {room && !room.petFriendly && (
                    <p className="mt-1 text-xs text-red-300">
                      This room does not allow pets
                    </p>
                  )}
                </div>

                {/* Guest Information */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <h4 className="text-sm font-medium text-[#f8f4ef]">Guest Information</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                        className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                        Last Name *
                        </label>
                        <input
                          type="text"
                          value={guestInfo.lastName}
                          onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                          className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                        className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="h-4 w-4 rounded border-white/30 text-accent-lime-500 focus:ring-accent-lime-500"
                        />
                        <span className="ml-2 block text-sm text-[#f8f4ef]/80">
                          Create an account for future bookings
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              
              {/* Price Summary */}
              <div className="mt-6 rounded-lg border border-accent-lime-500/20 bg-primary-600/25 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#f8f4ef]/70">Price per night</span>
                  <span className="font-medium text-[#f8f4ef]">{priceFormatted}</span>
                </div>
                {totalCost > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#f8f4ef]/70">{nights} night{nights > 1 ? 's' : ''}</span>
                    <span className="font-medium text-[#f8f4ef]">{totalPriceFormatted}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/15">
                  <span className="font-semibold text-[#f8f4ef]">Total</span>
                  <span className="text-lg font-bold text-accent-lime-500">
                    {totalCost > 0 ? totalPriceFormatted : 'Select dates'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleBooking}
                className="mt-6 w-full rounded-lg bg-accent-lime-500 py-3 font-medium text-[#2b0818] transition-colors hover:bg-accent-lime-300"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Success Modal */}
      {bookingResult && (
        <BookingSuccessModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          bookingData={bookingResult}
        />
      )}
    </div>
  );
}
