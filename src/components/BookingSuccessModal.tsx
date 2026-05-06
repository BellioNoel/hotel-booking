import { useNavigate } from "react-router-dom";
import { X, CheckCircle, Key, Calendar, Receipt, User } from "lucide-react";

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    booking: any;
    totalCost: number;
    nights: number;
    accountCreated?: {
      email: string;
      password: string;
    };
  };
}

export default function BookingSuccessModal({ isOpen, onClose, bookingData }: BookingSuccessModalProps) {
  const navigate = useNavigate();

  const handleAuthenticateAndNavigate = async (route: string) => {
    if (bookingData.accountCreated) {
      try {
        // Store credentials for authentication after navigation
        localStorage.setItem('tempCredentials', JSON.stringify({
          email: bookingData.accountCreated.email,
          password: bookingData.accountCreated.password
        }));
        
        onClose();
        navigate(route);
      } catch (error) {
        console.error('Authentication setup failed:', error);
        onClose();
        navigate('/login');
      }
    } else {
      // For existing users, just navigate
      onClose();
      navigate(route);
    }
  };

  const handleViewBookings = () => {
    handleAuthenticateAndNavigate('/my-bookings');
  };

  const handleUpdatePassword = () => {
    handleAuthenticateAndNavigate('/profile');
  };

  const handleBookAnotherRoom = () => {
    onClose();
    navigate('/rooms');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-green-50 px-6 py-4 rounded-t-xl border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
                <p className="text-sm text-green-700">Your room has been secured</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Success Message */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900 font-medium text-center">
              YOUR ROOM HAS BEEN SECURED FOR YOU, PENDING ON YOUR ARRIVAL.
            </p>
          </div>

          {/* Account Creation Info */}
          {bookingData.accountCreated && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Your Temporary Password</h3>
                  <div className="bg-white p-3 rounded border border-amber-300">
                    <code className="text-amber-800 font-mono text-lg">
                      {bookingData.accountCreated.password}
                    </code>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    Make sure you update this password to keep your account secure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Details */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {bookingData.nights} night{bookingData.nights > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Receipt className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Total: {new Intl.NumberFormat("fr-CM", {
                  style: "currency",
                  currency: "XAF",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(bookingData.totalCost).replace("FCFA", "FCFA")}
              </span>
            </div>
            {bookingData.accountCreated && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Account: {bookingData.accountCreated.email}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewBookings}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Bookings
            </button>
            
            {bookingData.accountCreated && (
              <button
                onClick={handleUpdatePassword}
                className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Update Password
              </button>
            )}
            
            <button
              onClick={handleBookAnotherRoom}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Book Another Room
            </button>
          </div>

          {/* Email Notice */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              A booking receipt has been sent to your email address.
              {bookingData.accountCreated && " Account creation details have also been emailed."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
