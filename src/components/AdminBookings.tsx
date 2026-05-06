import { useState, useEffect, useCallback, useMemo } from "react";
import type { Booking, Room } from "../types";
import { bookingsAPI, roomsAPI, handleAPIRequest } from "../lib/api";
import { sendBookingStatusEmail } from "../lib/email";
import { Mail, CalendarCheck, XCircle, BookOpen, Filter, Search, User, Calendar, Home, Clock, DollarSign, Trash2 } from "lucide-react";

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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");

  const [emailSentCount, setEmailSentCount] = useState(0);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);

  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [messageModal, setMessageModal] = useState<MessageModalState>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  // ---------- Load ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsResponse, roomsResponse] = await Promise.all([
        handleAPIRequest(() => bookingsAPI.getAllBookings()),
        handleAPIRequest(() => roomsAPI.getAllRooms())
      ]);
      
      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data.bookings || []);
      }
      if (roomsResponse.data) {
        setRooms(roomsResponse.data.rooms || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setBookings([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Helpers ----------
  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r._id === id),
    [rooms]
  );

  // Calculate booking duration in nights
  const getBookingDuration = useCallback((booking: Booking) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Filter bookings based on all criteria
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(b => 
        (b.user?.name?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.firstName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.lastName?.toLowerCase().includes(userFilter.toLowerCase())) ||
        (b.guestInfo?.email?.toLowerCase().includes(userFilter.toLowerCase()))
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bookingDate === dateFilter;
      });
    }

    // Room filter
    if (roomFilter) {
      filtered = filtered.filter(b => 
        b.room?.name?.toLowerCase().includes(roomFilter.toLowerCase())
      );
    }

    // Duration filter
    if (durationFilter !== "all") {
      filtered = filtered.filter(b => {
        const duration = getBookingDuration(b);
        switch (durationFilter) {
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
            return duration === parseInt(durationFilter);
          case "6+":
            return duration >= 6 && duration < 10;
          case "10+":
            return duration >= 10;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [bookings, statusFilter, userFilter, dateFilter, roomFilter, durationFilter, getBookingDuration]);

  // Sort filtered bookings
  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    return sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [filteredBookings, sort]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = bookings.length;
    const accepted = bookings.filter(b => b.status === 'confirmed').length;
    const rejected = bookings.filter(b => b.status === 'cancelled').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    
    return {
      total,
      accepted,
      rejected,
      pending,
      emailSent: emailSentCount
    };
  }, [bookings, emailSentCount]);

  // ---------- Accept ----------
  async function handleAccept(b: Booking) {
    setAcceptingId(b.id);
    try {
      await handleAPIRequest(() => bookingsAPI.updateBookingStatus(b.id, 'confirmed'));
      
      const emailResult = await sendBookingStatusEmail(b, 'accepted', 'Booking Confirmed', 'Your booking has been confirmed. We look forward to welcoming you!');
      
      if (emailResult.success) {
        setEmailSentCount(prev => prev + 1);
        setMessageModal({
          open: true,
          title: "Booking Accepted",
          message: `Booking has been accepted and confirmation email sent.`,
          tone: "success",
        });
      } else {
        setMessageModal({
          open: true,
          title: "Booking Accepted",
          message: `Booking has been accepted but failed to send confirmation email: ${emailResult.error}`,
          tone: "error",
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Error accepting booking:', error);
      setMessageModal({
        open: true,
        title: "Error",
        message: "Failed to accept booking. Please try again.",
        tone: "error",
      });
    } finally {
      setAcceptingId(null);
    }
  }

  // ---------- Reject ----------
  async function handleReject() {
    if (!rejecting) return;

    setRejectingId(rejecting.id);
    try {
      await handleAPIRequest(() => bookingsAPI.updateBookingStatus(rejecting.id, 'cancelled'));
      
      const emailResult = await sendBookingStatusEmail(rejecting, 'rejected', 'Booking Rejected', `We're sorry to inform you that your booking has been rejected for the following reason: ${rejectReason}`);
      
      if (emailResult.success) {
        setEmailSentCount(prev => prev + 1);
        setMessageModal({
          open: true,
          title: "Booking Rejected",
          message: "Booking has been rejected and notification email sent.",
          tone: "success",
        });
      } else {
        setMessageModal({
          open: true,
          title: "Booking Rejected",
          message: `Booking has been rejected but failed to send notification email: ${emailResult.error}`,
          tone: "error",
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setMessageModal({
        open: true,
        title: "Error",
        message: "Failed to reject booking. Please try again.",
        tone: "error",
      });
    } finally {
      setRejectingId(null);
      setRejecting(null);
      setRejectReason("");
    }
  }

  // ---------- Delete ----------
  async function handleDelete(b: Booking) {
    const checkoutDate = new Date(b.checkOut);
    const today = new Date();
    
    if (checkoutDate > today) {
      setMessageModal({
        open: true,
        title: "Cannot Delete Booking",
        message: "This booking cannot be deleted because the checkout date has not passed yet.",
        tone: "error",
      });
      return;
    }

    try {
      await handleAPIRequest(() => bookingsAPI.deleteBooking(b.id));
      
      setMessageModal({
        open: true,
        title: "Booking Deleted",
        message: "Booking has been successfully deleted.",
        tone: "success",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setMessageModal({
        open: true,
        title: "Error",
        message: "Failed to delete booking. Please try again.",
        tone: "error",
      });
    }
  }

  // ---------- Send Bulk Emails for Existing Bookings ----------
  async function sendBulkEmails() {
    setSendingBulkEmails(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const processedBookings = bookings.filter(b => 
        (b.status === 'confirmed' || b.status === 'cancelled') && 
        (b.guestInfo?.email || b.user?.email)
      );

      for (const booking of processedBookings) {
        try {
          let emailResult;
          if (booking.status === 'confirmed') {
            emailResult = await sendBookingStatusEmail(
              booking, 
              'accepted', 
              'Booking Confirmation', 
              'This is a confirmation of your booking. We look forward to welcoming you!'
            );
          } else if (booking.status === 'cancelled') {
            emailResult = await sendBookingStatusEmail(
              booking, 
              'rejected', 
              'Booking Status Update', 
              'This is an update regarding your booking status.'
            );
          }

          if (emailResult?.success) {
            successCount++;
            setEmailSentCount(prev => prev + 1);
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Failed to send email for booking:', booking.id, error);
          failCount++;
        }
      }

      setMessageModal({
        open: true,
        title: "Bulk Email Complete",
        message: `Successfully sent ${successCount} emails${failCount > 0 ? ` and failed to send ${failCount} emails` : ''}.`,
        tone: failCount > 0 ? "error" : "success",
      });
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      setMessageModal({
        open: true,
        title: "Error",
        message: "Failed to send bulk emails. Please try again.",
        tone: "error",
      });
    } finally {
      setSendingBulkEmails(false);
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("FCFA", "FCFA");
  };

  // Get status color
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sendingBulkEmails ? 'Sending Emails...' : 'Send Emails to Existing Bookings'}
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total Bookings" value={statistics.total} />
        <StatCard icon={<CalendarCheck className="w-5 h-5" />} label="Accepted" value={statistics.accepted} />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={statistics.rejected} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={statistics.pending} />
        <StatCard icon={<Mail className="w-5 h-5" />} label="Emails Sent" value={statistics.emailSent} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Accepted</option>
            <option value="cancelled">Rejected</option>
          </select>

          {/* User Filter */}
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

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Room Filter */}
          <div className="relative">
            <Home className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by room..."
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              onFocus={() => setShowRoomDropdown(true)}
              onBlur={() => setTimeout(() => setShowRoomDropdown(false), 200)}
              className="pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            {showRoomDropdown && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                {rooms.filter(room => 
                  room.name.toLowerCase().includes(roomFilter.toLowerCase())
                ).map(room => (
                  <div
                    key={room._id}
                    onMouseDown={() => {
                      setRoomFilter(room.name);
                      setShowRoomDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {room.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Duration Filter */}
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

          {/* Sort */}
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

      {/* Bookings List */}
      <div className="space-y-4">
        {sortedBookings.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No bookings found matching the current filters.
          </div>
        ) : (
          sortedBookings.map((b) => {
            const duration = getBookingDuration(b);
            // Get room from the populated rooms array or from the room object
            const room = b.rooms?.[0]?.room || b.room;
            const roomName = b.rooms?.[0]?.roomName || room?.name || 'Standard Room';
            const roomId = b.rooms?.[0]?.room?._id || room?._id || 'N/A';
            
            return (
              <div key={b.id} className="bg-white rounded-lg border p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {b.guestInfo ? `${b.guestInfo.firstName} ${b.guestInfo.lastName}` : b.user?.name || 'Guest'}
                    </h3>
                    <p className="text-gray-600">{b.guestInfo?.email || b.user?.email || 'No email'}</p>
                    <p className="text-gray-600">{b.guestInfo?.phone || 'No phone'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Room</div>
                      <div className="font-medium">{roomName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Dates</div>
                      <div className="font-medium">
                        {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{duration} night{duration !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="font-semibold text-lg">{formatCurrency(b.totalPrice || 0)}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Booked on {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {b.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleAccept(b)}
                      disabled={acceptingId === b.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {acceptingId === b.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="w-4 h-4" />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setRejecting(b)}
                      disabled={rejectingId === b.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {rejectingId === b.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Delete button - always visible but only works after checkout date */}
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => handleDelete(b)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                    title="Delete booking (only available after checkout date)"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this booking? Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject & Send Email
              </button>
              <button
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className={`text-center mb-4 ${
              messageModal.tone === 'success' ? 'text-green-600' :
              messageModal.tone === 'error' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {messageModal.tone === 'success' ? <CalendarCheck className="w-12 h-12 mx-auto mb-2" /> :
               messageModal.tone === 'error' ? <XCircle className="w-12 h-12 mx-auto mb-2" /> :
               <BookOpen className="w-12 h-12 mx-auto mb-2" />}
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">{messageModal.title}</h3>
            <p className="text-gray-600 text-center mb-4">{messageModal.message}</p>
            <button
              onClick={() => setMessageModal({ open: false, title: "", message: "", tone: "info" })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
