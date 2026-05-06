//src/lib/email.ts
import type { Booking } from "../types";

export type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

export async function sendBookingReceiptEmail(
  booking: any,
  roomName: string,
  totalCost: number,
  nights: number
): Promise<SendEmailResult> {
  const email = booking.guestInfo?.email?.trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Guest email is missing or invalid" };
  }

  const checkInDate = new Date(booking.checkIn).toLocaleDateString();
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
  const formattedCost = new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalCost);

  const emailData = {
    to: email,
    subject: "Booking Receipt - Franco Hotel",
    template: "booking-receipt",
    data: {
      guestName: `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
      guestEmail: booking.guestInfo.email,
      roomName,
      roomType: booking.rooms?.[0]?.room?.type || 'Standard Room',
      bedType: booking.rooms?.[0]?.room?.bedType || 'Queen Bed',
      capacity: booking.rooms?.[0]?.room?.capacity || 2,
      hasPets: booking.hasPets || false,
      numberOfGuests: booking.numberOfGuests?.adults || 2,
      roomNumber: booking.rooms?.[0]?.room?.roomNumber || 'TBA',
      roomSize: booking.rooms?.[0]?.room?.size || '25 sqm',
      roomImage: booking.rooms?.[0]?.room?.images?.[0] || null,
      roomPrice: booking.rooms?.[0]?.roomPrice ? 
        new Intl.NumberFormat("fr-CM", {
          style: "currency",
          currency: "XAF",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(booking.rooms[0].roomPrice) : 'TBA',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalCost: formattedCost,
      bookingId: booking.id
    }
  };

  try {
    const response = await fetch('http://localhost:5000/api/email/send-booking-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      let errorMessage = "Failed to send booking receipt email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Failed to send booking receipt email:", error);
    return { success: false, error: "Failed to send booking receipt email" };
  }
}

export async function sendAccountCreationEmail(
  email: string,
  tempPassword: string
): Promise<SendEmailResult> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email is missing or invalid" };
  }

  const emailData = {
    to: email,
    subject: "Account Created - Franco Hotel",
    template: "account-creation",
    data: {
      email,
      tempPassword,
      loginUrl: `${window.location.origin}/login`
    }
  };

  try {
    const response = await fetch('http://localhost:5000/api/email/send-account-creation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      let errorMessage = "Failed to send account creation email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Failed to send account creation email:", error);
    return { success: false, error: "Failed to send account creation email" };
  }
}

export async function sendBookingStatusEmail(
  booking: Booking,
  _status: "accepted" | "rejected",
  subject: string,
  body: string
): Promise<SendEmailResult> {
  const email = booking.guestInfo?.email?.trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Guest email is missing or invalid" };
  }

  const guestName = booking.guestInfo ? 
    `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}` : 
    "Guest";

  const emailData = {
    to: email,
    subject,
    template: "booking-status",
    data: {
      guestName,
      status: _status,
      message: body,
      checkIn: new Date(booking.checkIn).toLocaleDateString(),
      checkOut: new Date(booking.checkOut).toLocaleDateString(),
      bookingId: booking.id
    }
  };

  try {
    const response = await fetch('http://localhost:5000/api/email/send-booking-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      let errorMessage = "Failed to send booking status email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Failed to send booking status email:", error);
    return { success: false, error: "Failed to send booking status email" };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<SendEmailResult> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email is missing or invalid" };
  }

  const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

  const emailData = {
    to: email,
    subject: "Password Reset - Franco Hotel",
    template: "password-reset",
    data: {
      email,
      resetUrl,
      resetToken
    }
  };

  try {
    const response = await fetch('http://localhost:5000/api/email/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      let errorMessage = "Failed to send password reset email";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: "Failed to send password reset email" };
  }
}
