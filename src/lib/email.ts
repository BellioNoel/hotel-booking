/**
 * src/lib/email.ts
 * Email notifications via EmailJS.
 * Sends booking status (accepted/rejected) to the guest.
 * Configure via Vite env: VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID.
 */

import emailjs from "emailjs-com";
import type { Booking } from "../types";

/** Result of sending an email (success or error message). */
export type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

/** Env-based config; validated at send time. */
function getConfig(): {
  publicKey: string;
  serviceId: string;
  templateId: string;
} | null {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
  if (!publicKey?.trim() || !serviceId?.trim() || !templateId?.trim()) {
    return null;
  }
  return { publicKey: publicKey.trim(), serviceId: serviceId.trim(), templateId: templateId.trim() };
}

/** Ensures EmailJS is initialized with the public key. Call once before send. */
function ensureInit(): boolean {
  const config = getConfig();
  if (!config) return false;
  try {
    emailjs.init(config.publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a booking status email to the guest (accepted or rejected).
 * Uses full subject and body text from AdminBookings.
 *
 * @param booking - The booking with guest contact info and dates
 * @param status - "accepted" | "rejected"
 * @param subject - Email subject line
 * @param body - Full email body text
 * @returns Success or error result; does not throw
 */
export async function sendBookingStatusEmail(
  booking: Booking,
  status: "accepted" | "rejected",
  subject: string,
  body: string
): Promise<SendEmailResult> {
  const config = getConfig();
  if (!config) {
    return {
      success: false,
      error: "EmailJS is not configured (missing VITE_EMAILJS_* env variables).",
    };
  }

  if (!ensureInit()) {
    return { success: false, error: "Failed to initialize EmailJS." };
  }

  // Template params: map subject and body to your EmailJS template
  const templateParams = {
    email: booking.guestEmail,      // 👈 MUST match EmailJS "To Email"
    guest_name: booking.guestName || "Guest",
    status,
    subject,
    message: body,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
  };
  

  try {
    await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
