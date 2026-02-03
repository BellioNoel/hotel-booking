//src/lib/email.ts
import emailjs from "emailjs-com";
import type { Booking } from "../types";

export type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

function getConfig() {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceId || !templateId) {
    return null;
  }

  return {
    publicKey: publicKey.trim(),
    serviceId: serviceId.trim(),
    templateId: templateId.trim(),
  };
}

function initEmailJS(publicKey: string): boolean {
  try {
    emailjs.init(publicKey);
    return true;
  } catch {
    console.error("EmailJS failed to initialize");
    return false;
  }
}

export async function sendBookingStatusEmail(
  booking: Booking,
  _status: "accepted" | "rejected",
  subject: string,
  body: string
): Promise<SendEmailResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "Email service is not configured" };
  }

  if (!initEmailJS(config.publicKey)) {
    return { success: false, error: "Email service initialization failed" };
  }

  const email = booking.guestEmail?.trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Guest email is missing or invalid" };
  }

  const templateParams = {
    email,
    guest_name: booking.guestName || "Guest",
    subject: subject || "Booking update",
    message: body || "",
    check_in: booking.checkIn || "-",
    check_out: booking.checkOut || "-",
  };

  try {
    await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );

    console.info("Email sent successfully");
    return { success: true };
  } catch (err: any) {
    const message =
      err?.text ||
      err?.message ||
      "Email service rejected the request";

    console.error("Email send failed:", message);
    return { success: false, error: message };
  }
}
