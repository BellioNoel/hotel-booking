import { useState, useEffect, useCallback, useMemo } from "react";
import type { Booking, Room } from "../types";
import {
  getBookings,
  saveBooking,
  getRooms,
} from "../lib/firestoreStorage";
import { sendBookingStatusEmail } from "../lib/email";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    const [b, r] = await Promise.all([
      getBookings(),
      getRooms(),
    ]);
    setBookings(b);
    setRooms(r);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id) ?? null,
    [rooms]
  );

  // ---------- Helpers ----------
  const bookingNights = useCallback((booking: Booking) => {
    const cin = new Date(booking.checkIn);
    const cout = new Date(booking.checkOut);
    const diff = cout.getTime() - cin.getTime();
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  }, []);

  const bookingTotal = useCallback(
    (booking: Booking) =>
      booking.roomIds.reduce((sum, id) => {
        const room = getRoomById(id);
        return sum + (room?.price || 0) * bookingNights(booking);
      }, 0),
    [bookingNights, getRoomById]
  );

  const isRoomAvailable = useCallback(
    (booking: Booking) => {
      return !bookings.some((b) => {
        if (b.id === booking.id || b.status !== "accepted") return false;

        const cin = new Date(booking.checkIn);
        const cout = new Date(booking.checkOut);
        const bCin = new Date(b.checkIn);
        const bCout = new Date(b.checkOut);

        return booking.roomIds.some(
          (rid) => b.roomIds.includes(rid) && cin < bCout && cout > bCin
        );
      });
    },
    [bookings]
  );

  // ---------- Actions ----------
  async function handleAccept(booking: Booking) {
    setActingId(booking.id);

    const updated: Booking = { ...booking, status: "accepted" };
    await saveBooking(updated);
    await loadData();

    const total = bookingTotal(booking);

    const subject = "Your booking is approved!";
    const body = `Dear ${booking.guestName},

Your request for room(s) "${booking.roomIds
      .map((id) => getRoomById(id)?.name ?? id)
      .join(", ")}" in our hotel "SUPER-STAR HIGH RANK HOTEL" has been APPROVED.

The room(s) are preserved for you from ${booking.checkIn} to ${booking.checkOut}.
Make your payment of $${total.toLocaleString()} on arrival.

Best Regards,
SUPER-STAR, THE PLACE OF PEACE.`;

    const result = await sendBookingStatusEmail(booking, "accepted", subject, body);

    setActingId(null);
    setMessage(
      result.success
        ? { type: "success", text: "Booking accepted. Email sent to guest." }
        : { type: "error", text: `Booking accepted, but email failed: ${result.error}` }
    );
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleRejectSubmit() {
    if (!rejecting) return;

    setActingId(rejecting.id);

    const updated: Booking = { ...rejecting, status: "rejected" };
    await saveBooking(updated);
    await loadData();

    const subject = "Your booking request";
    const body = `Dear ${rejecting.guestName},

We regret to inform you that your booking could not be accommodated.

${rejectReason}

Best Regards,
SUPER-STAR, THE PLACE OF PEACE.`;

    const result = await sendBookingStatusEmail(rejecting, "rejected", subject, body);

    setActingId(null);
    setRejecting(null);
    setRejectReason("");

    setMessage(
      result.success
        ? { type: "success", text: "Booking rejected. Email sent to guest." }
        : { type: "error", text: `Booking rejected, but email failed: ${result.error}` }
    );
    setTimeout(() => setMessage(null), 5000);
  }

  // ---------- Derived ----------
  const pending = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);
  const other = useMemo(() => bookings.filter((b) => b.status !== "pending"), [bookings]);

  return (
    <section className="space-y-6 p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold">Bookings</h2>
      {/* UI unchanged */}
    </section>
  );
}
