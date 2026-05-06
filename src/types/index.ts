/** src/types/index.ts
 * Shared domain types for the hotel booking app.
 * Single source of truth – aligned with MongoDB models.
 */

/** Unique id for a room / booking (MongoDB ObjectId string). */
export type RoomId = string;
export type BookingId = string;
export type AdminKey = string;

/** Room entity – mirrors the MongoDB Room schema. */
export interface Room {
  _id: string;
  id: string;
  name: string;
  price: number;
  description: string;
  images: Array<{
    url: string;
    publicId: string;
    alt?: string;
    description?: string;
  }>;
  criteria: Array<{
    name: string;
    description: string;
  }>;
  rating: {
    average: number;
    count: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  petFriendly: boolean;
  roomType: string;
  bedType: string;
  capacity: number;
  size: string;
  maxGuests?: number;
  amenities?: string[];
  available?: boolean;
  isAvailable?: boolean;
  roomNumber?: string;
  floor?: number;
  view?: string;
  smokingAllowed?: boolean;
}

/** Review interface */
export interface Review {
  id: string;
  _id?: string;
  user?: { id: string; name: string; email: string };
  room: string;
  rating: number;
  comment?: string;
  isRegisteredUser: boolean;
  guestName?: string;
  guestEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/** Status of a booking – matches server enum. */
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no-show";

/** Populated room reference inside a booking. */
export interface BookingRoom {
  room: string | Room;
  roomName: string;
  roomPrice: number;
}

/** Booking entity – mirrors the MongoDB Booking schema. */
export interface Booking {
  _id?: string;
  id: BookingId;
  bookingNumber?: string;
  user?: {
    _id: string;
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  rooms?: BookingRoom[];
  room?: string | Room;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  numberOfGuests: { adults: number; children?: number } | number;
  hasPets?: boolean;
  totalPrice?: number;
  totalCost?: number;
  status: BookingStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  specialRequests?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
