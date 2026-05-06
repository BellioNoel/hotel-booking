import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export function usePendingBooking() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const checkPendingBooking = () => {
      const pendingBooking = localStorage.getItem('pendingBooking');
      
      if (pendingBooking) {
        try {
          const bookingData = JSON.parse(pendingBooking);
          
          // Clear the pending booking
          localStorage.removeItem('pendingBooking');
          
          // Show success message and redirect to complete booking
          showSuccess('Welcome Back!', 'Please complete your booking.');
          
          // Redirect to room details with the booking data
          setTimeout(() => {
            navigate(`/rooms/${bookingData.roomId}`, { state: { pendingBooking: bookingData } });
          }, 1000);
          
        } catch (error) {
          console.error('Failed to process pending booking:', error);
          localStorage.removeItem('pendingBooking');
        }
      }
    };

    // Only check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      checkPendingBooking();
    }
  }, [navigate, showSuccess, showError]);
}
