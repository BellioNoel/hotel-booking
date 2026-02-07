import { useState, useEffect, useCallback, useMemo } from "react";
import type { Booking, Room } from "../types";
import { getBookings, saveBooking, getRooms } from "../lib/firestoreStorage";
import { sendBookingStatusEmail } from "../lib/email";
import { Mail, CalendarCheck, XCircle, BookOpen } from "lucide-react";

type SortMode = "recent" | "oldest";
type StatusFilter = "all" | "pending" | "accepted" | "rejected";

type MessageModalState = {
  open: boolean;
  title: string;
  message: string;
  tone: "success" | "error" | "info";
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [emailSentCount, setEmailSentCount] = useState(0);

  const [proposedCheckIn, setProposedCheckIn] = useState("");
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [messageModal, setMessageModal] = useState<MessageModalState>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  // ---------- Load ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    const [b, r] = await Promise.all([getBookings(), getRooms()]);
    setBookings(b);
    setRooms(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Helpers ----------
  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms]
  );

  function overlaps(a: Booking, b: Booking) {
    const aIn = new Date(a.checkIn);
    const aOut = new Date(a.checkOut);
    const bIn = new Date(b.checkIn);
    const bOut = new Date(b.checkOut);
    return aIn < bOut && aOut > bIn;
  }

  function conflicts(booking: Booking) {
    return bookings.filter(
      (b) =>
        b.id !== booking.id &&
        b.status === "accepted" &&
        overlaps(booking, b) &&
        booking.roomIds.some((id) => b.roomIds.includes(id))
    );
  }

  const bookingTotal = useCallback(
    (b: Booking) =>
      b.roomIds.reduce((sum, id) => {
        const room = getRoomById(id);
        if (!room) return sum;
        const nights =
          (new Date(b.checkOut).getTime() -
            new Date(b.checkIn).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + room.price * Math.max(0, nights);
      }, 0),
    [getRoomById]
  );

  // ---------- Accept ----------
  async function handleAccept(b: Booking) {
    const updated: Booking = {
      ...b,
      status: "accepted",
      checkIn: proposedCheckIn || b.checkIn,
    };

    await saveBooking(updated);
    await loadData();

    const subject = "Booking Approved";
    const body = `Dear ${b.guestName},

Your booking has been APPROVED.

Rooms:
${b.roomIds.map((id) => getRoomById(id)?.name ?? id).join(", ")}

Check-in: ${updated.checkIn}
Check-out: ${b.checkOut}
NOTE: YOU ARE EXPECTLED TO STRICTLY MAKE PAYMENT ON ARRIVAL ON  ${updated.checkIn}
Total payable on arrival: FCFA${bookingTotal(b).toLocaleString()}

Best Regards,
FRANCO HOTEL`;

    const result = await sendBookingStatusEmail(
      b,
      "accepted",
      subject,
      body
    );

    if (result.success) {
      setEmailSentCount((c) => c + 1);
      setMessageModal({
        open: true,
        title: "Booking Accepted",
        message: "The booking was accepted and the approval email was sent successfully.",
        tone: "success",
      });
    } else {
      setMessageModal({
        open: true,
        title: "Email Failed",
        message: "Booking was accepted, but the confirmation email could not be sent.",
        tone: "error",
      });
    }

    setProposedCheckIn("");
  }

  // ---------- Reject ----------
  async function handleReject() {
    if (!rejecting) return;

    await saveBooking({ ...rejecting, status: "rejected" });
    await loadData();

    const result = await sendBookingStatusEmail(
      rejecting,
      "rejected",
      "Booking Rejected",
      `Dear ${rejecting.guestName},
      We're sorry to inform you that, your booking of the room in hour hotel has been reject for the following reasons

${rejectReason}

Regards,
FRANCO HOTEL`
    );

    if (result.success) {
      setEmailSentCount((c) => c + 1);
      setMessageModal({
        open: true,
        title: "Booking Rejected",
        message: "The rejection email was sent successfully.",
        tone: "success",
      });
    } else {
      setMessageModal({
        open: true,
        title: "Email Failed",
        message: "The booking was rejected, but the email could not be sent.",
        tone: "error",
      });
    }

    setRejecting(null);
    setRejectReason("");
  }

  // ---------- Derived ----------
  const filtered = useMemo(() => {
    let list = [...bookings];

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    list.sort((a, b) =>
      sort === "recent"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );

    return list;
  }, [bookings, sort, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      accepted: bookings.filter((b) => b.status === "accepted").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    };
  }, [bookings]);

  // ---------- UI ----------
  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Admin Bookings</h2>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Stat icon={<BookOpen />} label="Total" value={stats.total} />
        <Stat icon={<CalendarCheck />} label="Accepted" value={stats.accepted} />
        <Stat icon={<XCircle />} label="Rejected" value={stats.rejected} />
        <Stat icon={<Mail />} label="Emails Sent" value={emailSentCount} />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select onChange={(e) => setSort(e.target.value as SortMode)}>
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest</option>
        </select>

        <select onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <p>Loading bookings…</p>}

      {/* Bookings */}
      <div className="space-y-4">
        {filtered.map((b) => {
          const conflict = conflicts(b);

          return (
            <div key={b.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <div className="font-semibold">{b.guestName}</div>
                <span className="text-sm uppercase">{b.status}</span>
              </div>

              <div className="text-sm">{b.guestEmail}</div>
              <div className="text-sm">
                {b.checkIn} → {b.checkOut}
              </div>
              <div className="text-sm">
                Rooms: {b.roomIds.map((id) => getRoomById(id)?.name).join(", ")}
              </div>
              <div className="font-medium">
                Total: FCFA{bookingTotal(b).toLocaleString()}
              </div>

              {conflict.length > 0 && (
                <div className="rounded bg-red-50 p-2 text-sm text-red-700">
                  Room already booked by{" "}
                  <strong>{conflict[0].guestName}</strong>
                </div>
              )}

              {b.status === "pending" && (
                <div className="flex flex-col gap-2 pt-2">
                  {conflict.length > 0 && (
                    <input
                      type="date"
                      value={proposedCheckIn}
                      onChange={(e) => setProposedCheckIn(e.target.value)}
                      placeholder="Propose new check-in"
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(b)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setRejecting(b)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject modal */}
      {rejecting && (
        <div className="border p-4 rounded space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason"
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleReject}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Confirm Reject
          </button>
        </div>
      )}

      {/* Message modal */}
      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold">{messageModal.title}</h3>
            <p className="text-sm text-gray-700">{messageModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setMessageModal((m) => ({ ...m, open: false }))
                }
                className="rounded-xl bg-primary-600 px-4 py-2 text-white transition hover:-translate-y-0.5 hover:bg-primary-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded border p-4 flex items-center gap-3">
      <div className="text-gray-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
