/**
 * LocalStorage persistence layer for the hotel booking app.
 * All keys and (de)serialization are centralized here.
 * Uses safe JSON parse with fallbacks; does not throw.
 */

import type { Room, Booking, AdminKey, RoomId, BookingId } from "../types";

/** LocalStorage key for the list of rooms. */
export const STORAGE_KEY_ROOMS = "hotel-booking:rooms";

/** LocalStorage key for the list of bookings. */
export const STORAGE_KEY_BOOKINGS = "hotel-booking:bookings";

/** LocalStorage key for the admin secret (single string). */
export const STORAGE_KEY_ADMIN = "hotel-booking:admin-key";

/** Default value when storage is missing or invalid. */
const DEFAULT_ROOMS: Room[] = [];
const DEFAULT_BOOKINGS: Booking[] = [];

/**
 * Safely parses JSON from LocalStorage. Returns default on missing/invalid.
 */
function getJson<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined" || !window.localStorage) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return defaultValue;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Writes JSON to LocalStorage. No-op when localStorage is unavailable.
 */
function setJson<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or other write error; ignore to avoid breaking the app
  }
}

/** Generates a unique id for rooms/bookings (browser-safe). */
export function generateId(): string {
  return crypto.randomUUID();
}

// ---------- Rooms ----------

export function getRooms(): Room[] {
  const raw = getJson<unknown>(STORAGE_KEY_ROOMS, []);
  return Array.isArray(raw) ? (raw as Room[]) : DEFAULT_ROOMS;
}

export function getRoomById(id: RoomId): Room | null {
  return getRooms().find((r) => r.id === id) ?? null;
}

export function saveRoom(room: Room): void {
  const rooms = getRooms();
  const index = rooms.findIndex((r) => r.id === room.id);
  const next = [...rooms];
  if (index >= 0) next[index] = room;
  else next.push(room);
  setJson(STORAGE_KEY_ROOMS, next);
}

export function deleteRoom(id: RoomId): void {
  setJson(
    STORAGE_KEY_ROOMS,
    getRooms().filter((r) => r.id !== id)
  );
}

// ---------- Bookings ----------

export function getBookings(): Booking[] {
  const raw = getJson<unknown>(STORAGE_KEY_BOOKINGS, []);
  return Array.isArray(raw) ? (raw as Booking[]) : DEFAULT_BOOKINGS;
}

export function getBookingById(id: BookingId): Booking | null {
  return getBookings().find((b) => b.id === id) ?? null;
}

export function saveBooking(booking: Booking): void {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === booking.id);
  const next = [...bookings];
  if (index >= 0) next[index] = booking;
  else next.push(booking);
  setJson(STORAGE_KEY_BOOKINGS, next);
}

export function deleteBooking(id: BookingId): void {
  setJson(
    STORAGE_KEY_BOOKINGS,
    getBookings().filter((b) => b.id !== id)
  );
}

// ---------- Admin key ----------

export function getAdminKey(): AdminKey | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const value = window.localStorage.getItem(STORAGE_KEY_ADMIN);
  return value === "" || value == null ? null : value;
}

export function setAdminKey(key: AdminKey): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY_ADMIN, key);
}

export function clearAdminKey(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY_ADMIN);
}
