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
  
  // ---------- Utils ----------
  
  export function generateId(): string {
    return crypto.randomUUID();
  }
  
  // ---------- Rooms ----------
  
  const roomsRef = collection(db, "rooms");
  
  export async function getRooms(): Promise<Room[]> {
    const snapshot = await getDocs(roomsRef);
  
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Room, "id">),
    }));
  }
  
  export async function getRoomById(id: RoomId): Promise<Room | null> {
    const ref = doc(db, "rooms", id);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) return null;
  
    return {
      id: snap.id,
      ...(snap.data() as Omit<Room, "id">),
    };
  }
  
  export async function saveRoom(room: Room): Promise<void> {
    const ref = doc(db, "rooms", room.id);
    await setDoc(ref, room);
  }
  
  export async function deleteRoom(id: RoomId): Promise<void> {
    await deleteDoc(doc(db, "rooms", id));
  }
  
  // ---------- Bookings ----------
  
  const bookingsRef = collection(db, "bookings");
  
  export async function getBookings(): Promise<Booking[]> {
    const snapshot = await getDocs(bookingsRef);
  
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Booking, "id">),
    }));
  }
  
  export async function getBookingById(
    id: BookingId
  ): Promise<Booking | null> {
    const ref = doc(db, "bookings", id);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) return null;
  
    return {
      id: snap.id,
      ...(snap.data() as Omit<Booking, "id">),
    };
  }
  
  export async function saveBooking(booking: Booking): Promise<void> {
    const ref = doc(db, "bookings", booking.id);
    await setDoc(ref, booking);
  }
  
  export async function deleteBooking(id: BookingId): Promise<void> {
    await deleteDoc(doc(db, "bookings", id));
  }
  
  // ---------- Admin key ----------
  
  const adminRef = doc(db, "config", "admin");
  
  export async function getAdminKey(): Promise<AdminKey | null> {
    const snap = await getDoc(adminRef);
    return snap.exists() ? (snap.data().key as AdminKey) : null;
  }
  
  export async function setAdminKey(key: AdminKey): Promise<void> {
    await setDoc(adminRef, { key });
  }
  
  export async function clearAdminKey(): Promise<void> {
    await deleteDoc(adminRef);
  }
  