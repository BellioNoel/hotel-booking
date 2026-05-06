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

/**
 * Room entity: name, price, description, images.
 * Images are stored as URLs (Cloudinary), not base64.
 */
export interface Room {
  id: RoomId;
  name: string;
  price: number;
  description: string;

  /**
   * Image objects for display and storage.
   * Currently backed by Cloudinary secure URLs with public IDs.
   */
  images: Array<{
    url: string;
    publicId: string;
    alt?: string;
    description?: string;
  }>;

  /** Dynamic criteria for room features */
  criteria: Array<{
    name: string;
    description: string;
  }>;

  /** Rating system */
  rating: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };

  /** Pet friendly status */
  petFriendly: boolean;

  /** Room details */
  roomType: string;
  bedType: string;
  capacity: number;
  size: string;
  maxGuests?: number;
  amenities?: string[];
  available?: boolean;
  roomNumber?: string;
}

/** Review interface */
export interface Review {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  room: string;
  rating: number;
  comment?: string;
  isRegisteredUser: boolean;
  guestName?: string;
  guestEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/** Status of a booking after admin action. */
export type BookingStatus = "pending" | "accepted" | "rejected";

/** Booking entity: single room, guest info, date range, status. */
export interface Booking {
  id: BookingId;

  /** Room included in this booking. */
  room: string;

  /** Date range for the booking. */
  checkIn: string;
  checkOut: string;

  /** Guest information. */
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  /** Number of guests. */
  numberOfGuests: number;

  /** Pet information. */
  hasPets: boolean;

  /** Total cost. */
  totalCost: number;

  /** Current status. */
  status: BookingStatus;

  /** When the booking was created. */
  createdAt: string;

  /** When the booking was last updated. */
  updatedAt: string;
}
