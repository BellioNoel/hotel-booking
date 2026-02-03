// src/lib/sessionStorage.ts
import type { AdminKey } from "../types";

/* ------------------------------------------------------------------
   User / session storage (EXISTING LOGIC — unchanged)
------------------------------------------------------------------- */

const SESSION_KEY = "hotel-booking:session";
const EXPIRY_KEY = "hotel-booking:expiry";

export function setSession(token: string, ttlMs: number): void {
  const expiry = Date.now() + ttlMs;
  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));
}

export function getSession(): string | null {
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY));

  if (!token || !expiry || Date.now() > expiry) {
    clearSession();
    return null;
  }

  return token;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

/* ------------------------------------------------------------------
   Admin authentication (ADDED — required by AdminLogin & Admin routes)
------------------------------------------------------------------- */

const ADMIN_KEY_STORAGE = "hotel-booking:admin";

export function setAdminKey(key: AdminKey, rememberMe: boolean): void {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
}

export function getAdminKey(): AdminKey | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) as AdminKey | null;
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}
