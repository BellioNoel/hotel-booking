/**
 * User-facing page: browse rooms, select dates, book rooms.
 * Compact hero with single-slot animated slogan.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { roomsAPI, handleAPIRequest } from "../lib/api";
import type { Room, RoomId } from "../types";
import RoomCard from "../components/RoomCard";
import BookingForm from "../components/BookingForm";
import { Search, Filter } from "lucide-react";

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
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingRoomIds, setBookingRoomIds] = useState<RoomId[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [showFilters, setShowFilters] = useState(false);

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
    "text-[#d7f29f]",
    "text-[#b5ea53]",
    "text-[#e7ffbe]",
    "text-[#c8ec78]",
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
    const { data, error } = await handleAPIRequest(() => roomsAPI.getRooms());
    if (data) {
      setRooms(data.rooms);
      setFilteredRooms(data.rooms);
    } else if (error) {
      console.error('Failed to load rooms:', error);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Filter rooms when search or filters change
  useEffect(() => {
    let filtered = rooms;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(room => room.roomType === selectedType);
    }

    // Price filter
    filtered = filtered.filter(room =>
      room.price >= priceRange.min && room.price <= priceRange.max
    );

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, selectedType, priceRange]);

  /* ---------- ACTIONS ---------- */
  function handleBook(room: Room) {
    setBookingRoomIds([room.id]);
    setBookingModalOpen(true);
  }

  function handleBookingSuccess() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
    setSuccessMessage("Booking submitted! We’ll confirm your request by email shortly thanks for wishing to be with you.");
    setTimeout(() => setSuccessMessage(null), 6000);
  }

  function handleBookingCancel() {
    setBookingModalOpen(false);
    setBookingRoomIds([]);
  }

  /* ---------- RENDER ---------- */
  return (
    <main className="min-h-screen bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] text-[#f8f4ef]">
      {/* HERO (COMPACT) */}
      <section className="border-b border-accent-lime-500/20 bg-[#250913]/70 px-4 py-8 text-center backdrop-blur-sm">
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
        <p className="mt-2 max-w-2xl mx-auto text-sm text-[#f8f4ef]/85 sm:text-base">
          {descriptions[index % descriptions.length]}
        </p>
      </section>

      {/* ROOMS */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="mb-4 text-xl sm:text-2xl font-semibold text-[#f8f4ef]">
            Our Rooms
          </h2>
          
          {/* Search and Filters */}
          <div className="rounded-xl border border-white/10 bg-[#2a0e1a]/85 p-4 shadow-sm">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f8f4ef]/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search rooms by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 py-2 pl-10 pr-4 text-[#f8f4ef] placeholder:text-[#f8f4ef]/45 focus:outline-none focus:ring-2 focus:ring-accent-lime-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {(selectedType || priceRange.min > 0 || priceRange.max < 200000) && (
                  <span className="rounded-full bg-accent-lime-500 px-2 py-1 text-xs font-semibold text-[#2b0818]">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="space-y-4 border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Room Type Filter */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                      Room Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:outline-none focus:ring-2 focus:ring-accent-lime-500"
                    >
                      <option value="">All Types</option>
                      <option value="standard">Standard</option>
                      <option value="deluxe">Deluxe</option>
                      <option value="suite">Suite</option>
                      <option value="family">Family</option>
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#f8f4ef]/80">
                      Price Range (FCFA)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                        className="flex-1 rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:outline-none focus:ring-2 focus:ring-accent-lime-500"
                      />
                      <span className="text-[#f8f4ef]/60">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 200000 })}
                        className="flex-1 rounded-lg border border-white/20 bg-[#1a0710]/80 px-3 py-2 text-[#f8f4ef] focus:outline-none focus:ring-2 focus:ring-accent-lime-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedType('');
                      setPriceRange({ min: 0, max: 200000 });
                    }}
                    className="text-sm font-medium text-[#d7f29f] hover:text-accent-lime-300"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {searchTerm || selectedType || priceRange.min > 0 || priceRange.max < 200000 ? (
          <div className="mb-4 text-sm text-[#f8f4ef]/70">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </div>
        ) : null}

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 py-12 text-center">
            <Search className="mx-auto mb-3 h-12 w-12 text-[#f8f4ef]/35" />
            <p className="text-[#d7f29f]">
              {rooms.length === 0 ? 'No rooms available yet.' : 'No rooms match your search criteria.'}
            </p>
            {(searchTerm || selectedType || priceRange.min > 0 || priceRange.max < 200000) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setPriceRange({ min: 0, max: 200000 });
                }}
                className="mt-3 text-sm font-medium text-[#d7f29f] hover:text-accent-lime-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room, i) => (
              <li
                key={room.id}
                className="rounded-2xl border border-white/10 bg-transparent shadow-sm transition-transform hover:scale-[1.02]"
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
          <div className="rounded-2xl border border-white/10 bg-[#2a0e1a] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2
                id="booking-modal-title"
                className="font-semibold text-[#f8f4ef]"
              >
                Complete your booking
              </h2>
              <button
                onClick={handleBookingCancel}
                className="text-xl text-[#d7f29f]"
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

      {/* SUCCESS MODAL */}
      {successMessage && (
        <BookingModalOverlay
          onClose={() => setSuccessMessage(null)}
          titleId="booking-success-title"
        >
          <div className="rounded-2xl border border-white/10 bg-[#2a0e1a] p-6 text-center shadow-xl">
            <h2
              id="booking-success-title"
              className="mb-3 text-lg font-semibold text-[#d7f29f]"
            >
              Booking Successful 🎉
            </h2>

            <p className="mb-6 text-sm text-[#f8f4ef]/80">
              {successMessage}
            </p>

            <button
              onClick={() => setSuccessMessage(null)}
              className="
                inline-flex items-center justify-center
                rounded-xl px-6 py-2.5
                text-sm font-semibold text-[#2b0818]
                bg-accent-lime-500
                shadow-md
                transition-all duration-300
                hover:bg-accent-lime-300 hover:-translate-y-0.5 hover:shadow-lg
                active:bg-accent-lime-500
                focus:outline-none focus:ring-2 focus:ring-accent-lime-500 focus:ring-offset-2
              "
            >
              Back to hotel
            </button>
          </div>
        </BookingModalOverlay>
      )}
    </main>
  );
}
