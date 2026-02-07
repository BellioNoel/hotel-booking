// src/components/BookingForm.tsx
import { useState, useId, useEffect, useMemo, useCallback } from "react";
import type { Room, RoomId } from "../types";
import {
  saveBooking,
  generateId,
  getRoomById,
} from "../lib/firestoreStorage";

export interface BookingFormProps {
  roomIds: RoomId[];
  allRooms: Room[];
  onSuccess: () => void;
  onCancel: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingForm({
  roomIds,
  allRooms,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<RoomId[]>(roomIds);
  const [effectiveRooms, setEffectiveRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    setSelectedIds(roomIds);
  }, [roomIds]);

  // 🔥 Resolve rooms from Firestore (async-safe)
  useEffect(() => {
    let active = true;

    async function resolveRooms() {
      setLoadingRooms(true);
      try {
        const rooms = await Promise.all(
          selectedIds.map((id) => getRoomById(id))
        );
        if (active) {
          setEffectiveRooms(
            rooms.filter((r): r is Room => r !== null)
          );
        }
      } catch {
        if (active) setError("Failed to load room details.");
      } finally {
        if (active) setLoadingRooms(false);
      }
    }

    resolveRooms();
    return () => {
      active = false;
    };
  }, [selectedIds]);

  const availableToAddFromForm = useMemo(
    () => allRooms.filter((r) => !selectedIds.includes(r.id)),
    [allRooms, selectedIds]
  );

  const handleAddRoom = useCallback((id: RoomId) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleRemoveRoom = useCallback((id: RoomId) => {
    setSelectedIds((prev) => prev.filter((rid) => rid !== id));
  }, []);

  // ---------- IDs ----------
  const checkInId = useId();
  const checkOutId = useId();
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();

  // ---------- Nights ----------
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const cin = new Date(checkIn);
    const cout = new Date(checkOut);
    const diff = cout.getTime() - cin.getTime();
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  }, [checkIn, checkOut]);

  // ---------- Total ----------
  const totalPrice = useMemo(() => {
    return effectiveRooms.reduce(
      (sum, r) => sum + r.price * nights,
      0
    );
  }, [effectiveRooms, nights]);

  function validate(): string | null {
    if (!checkIn.trim()) return "Please select check-in date.";
    if (!checkOut.trim()) return "Please select check-out date.";
    if (new Date(checkOut) <= new Date(checkIn))
      return "Check-out must be after check-in.";
    if (!guestName.trim()) return "Please enter your name.";
    if (!guestEmail.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim()))
      return "Please enter a valid email address.";
    if (!guestPhone.trim()) return "Please enter your phone number.";
    if (selectedIds.length === 0) return "Please select at least one room.";
    if (nights <= 0) return "Invalid stay duration.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    try {
      await saveBooking({
        id: generateId(),
        roomIds: selectedIds,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        checkIn,
        checkOut,
        status: "pending",
        createdAt: new Date().toISOString(),
        totalPrice,
      });

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Rooms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Rooms</h3>
        {loadingRooms && (
          <p className="text-sm text-gray-500 mt-2">Loading rooms…</p>
        )}
        <ul className="mt-2 space-y-2">
          {effectiveRooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {room.name} — FCFA{room.price}/night
              </span>
              {effectiveRooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRoom(room.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {availableToAddFromForm.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) handleAddRoom(e.target.value as RoomId);
              e.target.value = "";
            }}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Add another room…</option>
            {availableToAddFromForm.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — FCFA{r.price}/night
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          id={checkInId}
          type="date"
          min={todayISO()}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          required
        />
        <input
          id={checkOutId}
          type="date"
          min={checkIn || todayISO()}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          required
        />
      </div>

      {/* Guest */}
      <input
        id={nameId}
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        placeholder="Full Name"
        required
      />
      <input
        id={emailId}
        type="email"
        value={guestEmail}
        onChange={(e) => setGuestEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        id={phoneId}
        value={guestPhone}
        onChange={(e) => setGuestPhone(e.target.value)}
        placeholder="Phone"
        required
      />

      {/* Total */}
      {nights > 0 && effectiveRooms.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 text-sm font-medium">
          Total ({nights} night{nights > 1 ? "s" : ""}): FCFA
          {totalPrice.toLocaleString()}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
  <button
    type="button"
    onClick={onCancel}
    className="
      inline-flex items-center justify-center
      rounded-xl px-4 py-2.5
      text-sm font-medium
      text-gray-700
      bg-white border border-gray-300
      shadow-sm
      transition-all duration-200 ease-out
      hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md
      active:translate-y-0 active:shadow-sm
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
    "
  >
    Cancel
  </button>

  <button
    type="submit"
    disabled={submitting || loadingRooms}
    className="
      inline-flex items-center justify-center
      rounded-xl px-5 py-2.5
      text-sm font-semibold text-white
      bg-primary-600
      shadow-md
      transition-all duration-300 ease-out
      hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-700 hover:shadow-xl
      active:translate-y-0 active:scale-[0.98] active:bg-primary-800
      disabled:cursor-not-allowed disabled:opacity-60
      disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    "
  >
    {submitting ? "Booking…" : "Confirm booking"}
  </button>
</div>

    </form>
  );
}
