/** src/lib/User.tsx
 * User-facing page: browse rooms, select dates, book rooms.
 * Enhanced UI/UX: animations, transitions, hover effects, color shifts.
 */
import { useState, useEffect, useCallback } from "react";
import { getRooms } from "../lib/storage";
import type { Room, RoomId } from "../types";
import RoomCard from "../components/RoomCard";
import BookingForm from "../components/BookingForm";

function BookingModalOverlay({
  onClose,
  titleId,
  children,
}: {
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-pop">
        {children}
      </div>
    </div>
  );
}

export default function User() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingRoomIds, setBookingRoomIds] = useState<RoomId[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRooms = useCallback(() => setRooms(getRooms()), []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function handleBook(room: Room) {
    setBookingRoomIds([room.id]);
    setBookingModalOpen(true);
  }

  function handleBookingSuccess() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
    setSuccessMessage("Booking submitted! We'll confirm by email soon.");
    setTimeout(() => setSuccessMessage(null), 6000);
  }

  function handleBookingCancel() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white transition-colors duration-700">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-gray-200/60 bg-linear-to-br from-primary-50 via-white to-gray-50 px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 animate-slideDown">
            Find your perfect stay
          </h1>
          <p className="mt-2 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 animate-slideUp delay-200">
            Browse rooms and book in a few clicks. We’ll confirm your reservation by email.
          </p>
        </div>
      </section>

      {/* Success message */}
      {successMessage && (
        <div
          role="alert"
          className="mx-auto max-w-6xl px-4 py-4 sm:px-6 animate-fadeInDown"
        >
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm transition-colors hover:bg-green-100">
            {successMessage}
          </div>
        </div>
      )}

      {/* Rooms grid */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl mb-6 animate-slideDown">
          Our Rooms
        </h2>

        {rooms.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center animate-fadeIn">
            <p className="text-gray-600 font-medium">No rooms available yet.</p>
            <p className="mt-1 text-sm text-gray-500">Check back later or contact the hotel.</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-transform duration-500 hover:scale-[1.02] hover:shadow-lg animate-slideUp delay-[${index * 100}ms]"
              >
                <RoomCard room={room} onBook={handleBook} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Booking modal */}
      {bookingModalOpen && (
        <BookingModalOverlay
          onClose={handleBookingCancel}
          titleId="booking-modal-title"
        >
          <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl animate-pop">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2
                id="booking-modal-title"
                className="text-lg font-semibold text-gray-900 animate-slideDown"
              >
                Complete your booking
              </h2>
              <button
                type="button"
                onClick={handleBookingCancel}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 animate-fadeInUp">
              <BookingForm
                roomIds={bookingRoomIds}
                allRooms={rooms}
                onSuccess={handleBookingSuccess}
                onCancel={handleBookingCancel}
              />
            </div>
          </div>
        </BookingModalOverlay>
      )}
    </main>
  );
}
