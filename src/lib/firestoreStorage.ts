// src/lib/firestoreStorage.ts
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  import type { Room, Booking, AdminKey, RoomId, BookingId } from "../types";
  import {
    startGlobalLoading,
    stopGlobalLoading,
  } from "./loaderController";
  
  // ---------- Utils ----------
  
  export function generateId(): string {
    return crypto.randomUUID();
  }
  
  /**
   * Wraps any Firestore call with global loader handling.
   * Safe for parallel requests.
   */
  async function withLoader<T>(fn: () => Promise<T>): Promise<T> {
    startGlobalLoading();
    try {
      return await fn();
    } finally {
      stopGlobalLoading();
    }
  }
  
  // ---------- Rooms ----------
  
  const roomsRef = collection(db, "rooms");
  
  export async function getRooms(): Promise<Room[]> {
    return withLoader(async () => {
      const snapshot = await getDocs(roomsRef);
  
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Room, "id">),
      }));
    });
  }
  
  export async function getRoomById(id: RoomId): Promise<Room | null> {
    return withLoader(async () => {
      const ref = doc(db, "rooms", id);
      const snap = await getDoc(ref);
  
      if (!snap.exists()) return null;
  
      return {
        id: snap.id,
        ...(snap.data() as Omit<Room, "id">),
      };
    });
  }
  
  export async function saveRoom(room: Room): Promise<void> {
    return withLoader(async () => {
      const ref = doc(db, "rooms", room.id);
      await setDoc(ref, room);
    });
  }
  
  export async function deleteRoom(id: RoomId): Promise<void> {
    return withLoader(async () => {
      await deleteDoc(doc(db, "rooms", id));
    });
  }
  
  // ---------- Bookings ----------
  
  const bookingsRef = collection(db, "bookings");
  
  export async function getBookings(): Promise<Booking[]> {
    return withLoader(async () => {
      const snapshot = await getDocs(bookingsRef);
  
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Booking, "id">),
      }));
    });
  }
  
  export async function getBookingById(
    id: BookingId
  ): Promise<Booking | null> {
    return withLoader(async () => {
      const ref = doc(db, "bookings", id);
      const snap = await getDoc(ref);
  
      if (!snap.exists()) return null;
  
      return {
        id: snap.id,
        ...(snap.data() as Omit<Booking, "id">),
      };
    });
  }
  
  export async function saveBooking(booking: Booking): Promise<void> {
    return withLoader(async () => {
      const ref = doc(db, "bookings", booking.id);
      await setDoc(ref, booking);
    });
  }
  
  export async function deleteBooking(id: BookingId): Promise<void> {
    return withLoader(async () => {
      await deleteDoc(doc(db, "bookings", id));
    });
  }
  
  // ---------- Admin key ----------
  
  const adminRef = doc(db, "config", "admin");
  
  export async function getAdminKey(): Promise<AdminKey | null> {
    return withLoader(async () => {
      const snap = await getDoc(adminRef);
      return snap.exists() ? (snap.data().key as AdminKey) : null;
    });
  }
  
  export async function setAdminKey(key: AdminKey): Promise<void> {
    return withLoader(async () => {
      await setDoc(adminRef, { key });
    });
  }
  
  export async function clearAdminKey(): Promise<void> {
    return withLoader(async () => {
      await deleteDoc(adminRef);
    });
  }
  