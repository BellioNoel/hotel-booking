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

// ---------- Cloudinary (Media Storage) ----------
// NOTE:
// Firestore is NOT suitable for file storage.
// Cloudinary is used for room images & media assets.
// This implementation uses secure unsigned uploads.

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn(
    "[Cloudinary] Missing environment variables. Uploads will fail."
  );
}

/**
 * Uploads a file to Cloudinary and returns the secure URL + public_id
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "rooms"
): Promise<{ url: string; publicId: string }> {
  return withLoader(async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  });
}

/**
 * Deletes a Cloudinary asset.
 * IMPORTANT:
 * This requires a backend signature in production.
 * This function assumes you are proxying through a secure API route.
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<void> {
  return withLoader(async () => {
    await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });
  });
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
    // IMPORTANT: merge prevents accidental overwrites and data pollution
    await setDoc(ref, room, { merge: true });
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
    // IMPORTANT: merge prevents cross-document overwrites
    await setDoc(ref, booking, { merge: true });
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
    // IMPORTANT: merge ensures config isolation
    await setDoc(adminRef, { key }, { merge: true });
  });
}

export async function clearAdminKey(): Promise<void> {
  return withLoader(async () => {
    await deleteDoc(adminRef);
  });
}
