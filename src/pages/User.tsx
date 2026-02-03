/**
 * User-facing page: browse rooms, select dates, book rooms.
 * Compact hero with single-slot animated slogan.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { getRooms } from "../lib/firestoreStorage";
import type { Room, RoomId } from "../types";
import RoomCard from "../components/RoomCard";
import BookingForm from "../components/BookingForm";

/* ---------------- MODAL OVERLAY ---------------- */
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}

/* ---------------- MAIN PAGE ---------------- */
export default function User() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingRoomIds, setBookingRoomIds] = useState<RoomId[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ---------- HERO CONTENT ---------- */
  const slogans = useMemo(
    () => [
      "Find your perfect stay",
      "Comfort that feels like home",
      "Relax. Recharge. Rest easy.",
      "Where comfort meets convenience",
      "Your ideal room awaits",
      "Stay smart. Stay comfortable.",
      "Peaceful stays near the city",
      "Simple stays, real comfort",
      "Book comfort in minutes",
      "Rest better, travel smarter",
      "A calm stay starts here",
    ],
    []
  );

  const descriptions = useMemo(
    () => [
      "Located in Bonaberi, just 100 meters from the main road.",
      "Find us at Ancient SONEL, beside the 19th Police District.",
      "Perfectly positioned in Bonaberi for easy access.",
      "Only 100 meters from the street — easy to locate.",
      "Call 678507737 for directions or assistance.",
    ],
    []
  );

  const sloganColors = [
    "text-blue-700",
    "text-sky-600",
    "text-blue-600",
    "text-sky-500",
  ];

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  /* ---------- STRICT SINGLE-SLOT ROTATION ---------- */
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 1800);

    const switchTimer = setTimeout(() => {
      setIndex((i) => (i + 1) % slogans.length);
      setPhase("enter");
    }, 2300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(switchTimer);
    };
  }, [index, slogans.length]);

  /* ---------- DATA ---------- */
  const loadRooms = useCallback(async () => {
    const data = await getRooms();
    setRooms(data);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  /* ---------- ACTIONS ---------- */
  function handleBook(room: Room) {
    setBookingRoomIds([room.id]);
    setBookingModalOpen(true);
  }

  function handleBookingSuccess() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
    setSuccessMessage("Booking submitted! We’ll confirm by email shortly.");
    setTimeout(() => setSuccessMessage(null), 6000);
  }

  function handleBookingCancel() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
  }

  /* ---------- RENDER ---------- */
  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50 to-white">
      {/* HERO (COMPACT) */}
      <section className="border-b border-blue-100 bg-white px-4 py-8 text-center">
        {/* Fixed compact height */}
        <div className="relative h-10.5 sm:h-12">
          <h1
            key={index}
            className={`
              absolute inset-0 flex items-center justify-center
              text-xl sm:text-2xl md:text-3xl font-bold tracking-tight
              transition-all duration-500 ease-in-out
              ${sloganColors[index % sloganColors.length]}
              ${
                phase === "enter"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-3 scale-95"
              }
            `}
          >
            {slogans[index]}
          </h1>
        </div>

        {/* Location text — BLACK ONLY */}
        <p className="mt-2 max-w-2xl mx-auto text-sm sm:text-base text-black">
          {descriptions[index % descriptions.length]}
        </p>
      </section>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="rounded-lg border border-blue-200 bg-sky-50 px-4 py-2 text-blue-800 animate-slideDown">
            {successMessage}
          </div>
        </div>
      )}

      {/* ROOMS */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl sm:text-2xl font-semibold text-blue-900">
          Our Rooms
        </h2>

        {rooms.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-blue-200 py-12 text-center">
            <p className="text-blue-600">No rooms available yet.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <li
                key={room.id}
                className="rounded-2xl border border-blue-100 bg-white shadow-sm transition-transform hover:scale-[1.02]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <RoomCard room={room} onBook={handleBook} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BOOKING MODAL */}
      {bookingModalOpen && (
        <BookingModalOverlay
          onClose={handleBookingCancel}
          titleId="booking-modal-title"
        >
          <div className="rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2
                id="booking-modal-title"
                className="font-semibold text-blue-900"
              >
                Complete your booking
              </h2>
              <button
                onClick={handleBookingCancel}
                className="text-xl text-blue-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
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
