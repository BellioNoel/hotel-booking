import { useState, useEffect, useCallback } from "react";
import type { Booking } from "../types";
import { getBookings, saveBooking, getRoomById } from "../lib/storage";
import { sendBookingStatusEmail } from "../lib/email";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadBookings = useCallback(() => setBookings(getBookings()), []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Helper: calculate nights
  const bookingNights = (booking: Booking) => {
    const cin = new Date(booking.checkIn);
    const cout = new Date(booking.checkOut);
    const diff = cout.getTime() - cin.getTime();
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  };

  // Helper: calculate total price
  const bookingTotal = (booking: Booking) =>
    booking.roomIds.reduce((sum, id) => {
      const room = getRoomById(id);
      return sum + (room?.price || 0) * bookingNights(booking);
    }, 0);

  const isRoomAvailable = (booking: Booking) => {
    // Check if any room is booked for the same duration
    const overlapping = bookings.some((b) => {
      if (b.id === booking.id || b.status !== "accepted") return false;
      const cin = new Date(booking.checkIn);
      const cout = new Date(booking.checkOut);
      const bCin = new Date(b.checkIn);
      const bCout = new Date(b.checkOut);
      return booking.roomIds.some((rid) => b.roomIds.includes(rid) && cin < bCout && cout > bCin);
    });
    return !overlapping;
  };

  async function handleAccept(booking: Booking) {
    setActingId(booking.id);
    const updated: Booking = { ...booking, status: "accepted" };
    saveBooking(updated);
    loadBookings();

    const total = bookingTotal(booking);

    // Email content
    const subject = "Your booking is approved!";
    const body = `Dear ${booking.guestName},\n\nYour request for room(s) "${booking.roomIds
      .map((id) => getRoomById(id)?.name ?? id)
      .join(", ")}" in our hotel "SUPER-STAR HIGH RANK HOTEL" has been APPROVED.\n\nThe room(s) are preserved for you from ${booking.checkIn} to ${booking.checkOut}.\nFeel free to move in on ${booking.checkIn}.\nMake your payment of $${total.toLocaleString()} on arrival and enjoy your stay.\n\nWe are waiting to see you in your dream hotel. Stay blessed and safe.\n\nBest Regards,\nSUPER-STAR, THE PLACE OF PEACE.`;

    const result = await sendBookingStatusEmail(booking, "accepted", subject, body);

    setActingId(null);
    if (result.success) {
      setMessage({ type: "success", text: `Booking accepted. Email sent to guest.` });
    } else {
      setMessage({ type: "error", text: `Booking accepted, but email failed: ${result.error}` });
    }
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleRejectSubmit() {
    if (!rejecting) return;
    setActingId(rejecting.id);
    const updated: Booking = { ...rejecting, status: "rejected" };
    saveBooking(updated);
    loadBookings();

    const subject = "Your booking request";
    const body = `Dear ${rejecting.guestName},\n\nWe regret to inform you that your request for room(s) "${rejecting.roomIds
      .map((id) => getRoomById(id)?.name ?? id)
      .join(", ")}" in our hotel "SUPER-STAR HIGH RANK HOTEL" cannot be accommodated.\n\n${rejectReason}\n\nWe invite you to book another room at your convenience. We look forward to welcoming you.\n\nBest Regards,\nSUPER-STAR, THE PLACE OF PEACE.`;

    const result = await sendBookingStatusEmail(rejecting, "rejected", subject, body);

    setActingId(null);
    setRejecting(null);
    setRejectReason("");
    if (result.success) {
      setMessage({ type: "success", text: `Booking rejected. Email sent to guest.` });
    } else {
      setMessage({ type: "error", text: `Booking rejected, but email failed: ${result.error}` });
    }
    setTimeout(() => setMessage(null), 5000);
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const other = bookings.filter((b) => b.status !== "pending");

  return (
    <section className="space-y-6 p-4 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
        <span className="text-sm text-gray-500">{bookings.length} total</span>
      </header>

      {message && (
        <div
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm shadow-sm transition ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-gray-600 font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-gray-500">Bookings will appear here once guests make reservations.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {pending.length > 0 && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
                Pending approval
              </h3>
              <ul className="grid gap-4">
                {pending.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    nights={bookingNights(booking)}
                    total={bookingTotal(booking)}
                    roomNames={booking.roomIds.map((id) => getRoomById(id)?.name ?? id).join(", ")}
                    available={isRoomAvailable(booking)}
                    onAccept={() => handleAccept(booking)}
                    onReject={() => setRejecting(booking)}
                    acting={actingId === booking.id}
                  />
                ))}
              </ul>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
                Processed bookings
              </h3>
              <ul className="grid gap-4">
                {other.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    nights={bookingNights(booking)}
                    total={bookingTotal(booking)}
                    roomNames={booking.roomIds.map((id) => getRoomById(id)?.name ?? id).join(", ")}
                    available={true}
                    onAccept={() => {}}
                    onReject={() => {}}
                    acting={false}
                    showActions={false}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Rejection modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Reject Booking</h2>
            <p className="text-sm text-gray-600 mb-2">
              Optional reason to include in email to <strong>{rejecting.guestName}</strong>:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="Dear customer, unfortunately ..."
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setRejecting(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actingId === rejecting.id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actingId === rejecting.id ? "…" : "Send Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type BookingRowProps = {
  booking: Booking;
  nights: number;
  total: number;
  roomNames: string;
  available: boolean;
  onAccept: () => void;
  onReject: () => void;
  acting: boolean;
  showActions?: boolean;
};

function BookingRow({ booking, nights, total, roomNames, available, onAccept, onReject, acting, showActions = true }: BookingRowProps) {
  return (
    <li className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md bg-white`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1 text-sm flex-1">
          <p className="text-base font-semibold text-gray-900">{booking.guestName}</p>
          <p className="text-gray-600">{booking.guestEmail} | {booking.guestPhone}</p>
          <p className="text-gray-500">{booking.checkIn} → {booking.checkOut} ({nights} night{nights>1?'s':''})</p>
          <p className="text-gray-500">Rooms: {roomNames}</p>
          <p className="text-gray-700 font-medium">Total: ${total.toLocaleString()}</p>
          {!available && <p className="text-red-600 font-medium">⚠ Room unavailable for selected dates!</p>}
          <p className="text-xs text-gray-400 capitalize">Status: {booking.status}</p>
        </div>
        {showActions && (
          <div className="flex gap-3 sm:flex-col">
            <button
              type="button"
              onClick={onAccept}
              disabled={acting || !available}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {acting ? "…" : "Accept"}
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={acting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {acting ? "…" : "Reject"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
