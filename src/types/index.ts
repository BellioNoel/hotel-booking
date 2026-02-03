/** src/types/index.ts
 * Shared domain types for the hotel booking app.
 * Single source of truth for storage, API, and UI.
 */

/** Unique id for a room (generated, e.g. nanoid or crypto). */
export type RoomId = string;

/** Unique id for a booking. */
export type BookingId = string;

/** Admin secret key stored in session/local storage; used to gate admin routes. */
export type AdminKey = string;

/** Room entity: name, price, description, images (base64). */
export interface Room {
  id: RoomId;
  name: string;
  price: number;
  description: string;
  /** Image data URLs (base64) for display and storage. */
  images: string[];
}

/** Status of a booking after admin action. */
export type BookingStatus = "pending" | "accepted" | "rejected";

/** Booking entity: one or more rooms, guest info, date range, status. */
export interface Booking {
  id: BookingId;

  /** Room ids included in this booking. */
  roomIds: RoomId[];

  guestName: string;
  guestPhone: string;
  guestEmail: string;

  checkIn: string;   // ISO date string
  checkOut: string;  // ISO date string

  status: BookingStatus;

  /**
   * Cached total price for the booking.
   * Used by admin views, emails, and Firestore.
   */
  totalPrice: number;

  /** ISO date string when the booking was created. */
  createdAt: string;

  /** Optional audit field (safe for Firestore updates). */
  updatedAt?: string;
}
