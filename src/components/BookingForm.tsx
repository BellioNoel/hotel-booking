import { useState, useId, useEffect, useMemo } from "react";
import type { Room, RoomId } from "../types";
import { saveBooking, generateId, getRoomById } from "../lib/storage";

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
  const [selectedIds, setSelectedIds] = useState<RoomId[]>(() => roomIds);

  useEffect(() => {
    setSelectedIds(roomIds);
  }, [roomIds]);

  const checkInId = useId();
  const checkOutId = useId();
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();

  const effectiveRooms = selectedIds
    .map((id) => getRoomById(id))
    .filter((r): r is Room => r !== null);
  const availableToAddFromForm = allRooms.filter((r) => !selectedIds.includes(r.id));

  function handleAddRoom(id: RoomId) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function handleRemoveRoom(id: RoomId) {
    setSelectedIds((prev) => prev.filter((rid) => rid !== id));
  }

  // Calculate number of nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const cin = new Date(checkIn);
    const cout = new Date(checkOut);
    const diff = cout.getTime() - cin.getTime();
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  }, [checkIn, checkOut]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return effectiveRooms.reduce((sum, r) => sum + r.price * nights, 0);
  }, [effectiveRooms, nights]);

  function validate(): string | null {
    if (!checkIn.trim()) return "Please select check-in date.";
    if (!checkOut.trim()) return "Please select check-out date.";
    const cin = new Date(checkIn);
    const cout = new Date(checkOut);
    if (Number.isNaN(cin.getTime()) || Number.isNaN(cout.getTime()))
      return "Please enter valid dates.";
    if (cout <= cin) return "Check-out must be after check-in.";
    if (!guestName.trim()) return "Please enter your name.";
    if (!guestEmail.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim()))
      return "Please enter a valid email address.";
    if (!guestPhone.trim()) return "Please enter your phone number.";
    if (selectedIds.length === 0) return "Please select at least one room.";
    if (nights <= 0) return "Invalid check-in/check-out duration.";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      const booking = {
        id: generateId(),
        roomIds: selectedIds,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        checkIn: new Date(checkIn).toISOString().slice(0, 10),
        checkOut: new Date(checkOut).toISOString().slice(0, 10),
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        totalPrice,
      };
      saveBooking(booking);
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Selected rooms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Rooms</h3>
        <ul className="mt-2 space-y-2">
          {effectiveRooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-900">
                {room.name} — ${room.price}/night
              </span>
              {effectiveRooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRoom(room.id)}
                  className="text-gray-500 hover:text-red-600"
                  aria-label={`Remove ${room.name}`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {availableToAddFromForm.length > 0 && (
          <div className="mt-2">
            <select
              id="add-room"
              onChange={(e) => {
                const id = e.target.value as RoomId;
                if (id) handleAddRoom(id);
                e.target.value = "";
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Add another room…</option>
              {availableToAddFromForm.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — ${r.price}/night
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={checkInId} className="block text-sm font-medium text-gray-700 mb-1">
            Check-in
          </label>
          <input
            id={checkInId}
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor={checkOutId} className="block text-sm font-medium text-gray-700 mb-1">
            Check-out
          </label>
          <input
            id={checkOutId}
            type="date"
            min={checkIn || todayISO()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      {/* Guest details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Your details</h3>
        <input
          type="text"
          id={nameId}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Full Name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          required
        />
        <input
          type="email"
          id={emailId}
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          required
        />
        <input
          type="tel"
          id={phoneId}
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder="Phone"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          required
        />
      </div>

      {/* Total */}
      {nights > 0 && effectiveRooms.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 text-sm font-medium text-gray-900">
          Total ({nights} night{nights > 1 ? "s" : ""}): ${totalPrice.toLocaleString()}
          <p className="mt-1 text-gray-600 text-sm">This amount is to be paid on arrival.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? "Booking…" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}
