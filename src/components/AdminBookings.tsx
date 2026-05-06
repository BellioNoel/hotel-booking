import { useState, useEffect, useCallback, useMemo } from "react";
import type { Booking } from "../types";
import { bookingsAPI, handleAPIRequest } from "../lib/api";
import { sendBookingStatusEmail } from "../lib/email";
import { Mail, CalendarCheck, XCircle, BookOpen, Filter, User, Home, Clock } from "lucide-react";

type SortMode = "recent" | "oldest";
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";
type DurationFilter = "all" | "1" | "2" | "3" | "4" | "5" | "6+" | "10+";

type MessageModalState = {
  open: boolean;
  title: string;
  message: string;
  tone: "success" | "error" | "info";
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");

  const [emailSentCount, setEmailSentCount] = useState(0);
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [messageModal, setMessageModal] = useState<MessageModalState>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const bookingsResponse = await handleAPIRequest(() => bookingsAPI.getAllBookings());
      
      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getBookingDuration = useCallback((booking: Booking) => {
    const checkIn = new Date(booking.checkIn).getTime();
    const checkOut = new Date(booking.checkOut).getTime();
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }, []);

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(b => 
        (b.user?.name?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.user?.firstName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.user?.lastName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.user?.email?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.firstName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.lastName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.email?.toLowerCase().includes(userFilter.toLowerCase()))
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bookingDate === dateFilter;
      });
    }

    if (roomFilter) {
      filtered = filtered.filter(b => {
        const roomName = b.rooms?.[0]?.roomName || '';
        return roomName.toLowerCase().includes(roomFilter.toLowerCase());
      });
    }

    if (durationFilter !== "all") {
      filtered = filtered.filter(b => {
        const duration = getBookingDuration(b);
        if (durationFilter === "6+") return duration >= 6 && duration < 10;
        if (durationFilter === "10+") return duration >= 10;
        return duration === parseInt(durationFilter);
      });
    }

    return filtered;
  }, [bookings, statusFilter, userFilter, dateFilter, roomFilter, durationFilter, getBookingDuration]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    return sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [filteredBookings, sort]);

  const statistics = useMemo(() => {
    return {
      total: bookings.length,
      accepted: bookings.filter(b => b.status === 'confirmed').length,
      rejected: bookings.filter(b => b.status === 'cancelled').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      emailSent: emailSentCount
    };
  }, [bookings, emailSentCount]);

  async function handleAccept(b: Booking) {
    setAcceptingId(b.id);
    try {
      await handleAPIRequest(() => bookingsAPI.updateBookingStatus(b.id, 'confirmed'));
      await sendBookingStatusEmail(b, 'accepted', 'Booking Confirmed', 'Your booking has been confirmed!');
      setEmailSentCount(prev => prev + 1);
      setMessageModal({
        open: true,
        title: "Booking Accepted",
        message: `Booking confirmed and email sent.`,
        tone: "success",
      });
      await loadData();
    } catch (error) {
      setMessageModal({
        open: true,
        title: "Error",
        message: `Failed to accept booking`,
        tone: "error",
      });
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleReject(b: Booking) {
    if (!rejectReason.trim()) {
      setMessageModal({
        open: true,
        title: "Error",
        message: "Please provide a reason",
        tone: "error",
      });
      return;
    }

    setRejectingId(b.id);
    try {
      await handleAPIRequest(() => bookingsAPI.updateBookingStatus(b.id, 'cancelled', rejectReason));
      await sendBookingStatusEmail(b, 'rejected', 'Booking Cancelled', `Reason: ${rejectReason}`);
      setEmailSentCount(prev => prev + 1);
      setRejectReason("");
      setMessageModal({
        open: true,
        title: "Booking Rejected",
        message: `Booking rejected and email sent.`,
        tone: "success",
      });
      await loadData();
    } catch (error) {
      setMessageModal({
        open: true,
        title: "Error",
        message: `Failed to reject booking`,
        tone: "error",
      });
    } finally {
      setRejectingId(null);
    }
  }

  async function sendBulkEmails() {
    setSendingBulkEmails(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const booking of bookings) {
        try {
          await sendBookingStatusEmail(booking, booking.status as any, 'Booking Update', 'Update regarding your booking');
          successCount++;
          setEmailSentCount(prev => prev + 1);
        } catch {
          failCount++;
        }
      }

      setMessageModal({
        open: true,
        title: "Bulk Emails Complete",
        message: `Sent ${successCount} emails${failCount > 0 ? ` (${failCount} failed)` : ''}.`,
        tone: failCount > 0 ? "error" : "success",
      });
    } finally {
      setSendingBulkEmails(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("FCFA", "FCFA");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Admin Bookings</h2>
        <div className="flex gap-3">
          <button
            onClick={sendBulkEmails}
            disabled={sendingBulkEmails}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sendingBulkEmails ? 'Sending...' : 'Send Bulk Emails'}
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total" value={statistics.total} />
        <StatCard icon={<CalendarCheck className="w-5 h-5" />} label="Confirmed" value={statistics.accepted} />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Cancelled" value={statistics.rejected} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={statistics.pending} />
        <StatCard icon={<Mail className="w-5 h-5" />} label="Emails" value={statistics.emailSent} />
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by user..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="relative">
            <Home className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by room..."
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Durations</option>
            <option value="1">1 Night</option>
            <option value="2">2 Nights</option>
            <option value="3">3 Nights</option>
            <option value="4">4 Nights</option>
            <option value="5">5 Nights</option>
            <option value="6+">6+ Nights</option>
            <option value="10+">10+ Nights</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedBookings.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No bookings found.
          </div>
        ) : (
          sortedBookings.map((b) => {
            const duration = getBookingDuration(b);
            const roomName = b.rooms?.[0]?.roomName || 'Standard Room';
            
            return (
              <div key={b.id} className="bg-white rounded-lg border p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {b.guestInfo?.firstName || b.user?.firstName || 'Guest'} {b.guestInfo?.lastName || b.user?.lastName || ''}
                    </h3>
                    <p className="text-gray-600">{b.guestInfo?.email || b.user?.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Room</div>
                    <div className="font-medium">{roomName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Dates</div>
                    <div className="font-medium">
                      {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium">{duration} night{duration !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="font-semibold text-lg">{formatCurrency(b.totalPrice || 0)}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {b.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleAccept(b)}
                      disabled={acceptingId === b.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {acceptingId === b.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleReject(b)}
                      disabled={rejectingId === b.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {rejectingId === b.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {messageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-lg">{messageModal.title}</h3>
            <p className="text-gray-600 mt-2">{messageModal.message}</p>
            <button
              onClick={() => setMessageModal({ ...messageModal, open: false })}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
