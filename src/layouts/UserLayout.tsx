/** src/components/UserLayout.tsx
 * Layout for the user-facing app: header + outlet.
 * Premium branding with animated multi-color slogan.
 */
import { Outlet, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const SLOGANS = [
  "Your Home Away from Home",
  "Where Comfort Meets Elegance",
  "Unforgettable Stays, Unmatched Service",
  "Experience Luxury, Embrace Relaxation",
];

export default function UserLayout() {
  const [index, setIndex] = useState(0);

  // 🔁 Rotate slogan every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % SLOGANS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* ---------- Brand ---------- */}
          <Link to="/" className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-5xl font-extrabold text-red-600 leading-none">
                F
              </span>
              <div className="ml-1 flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-wide text-gray-900">
                  RANCO
                </span>
                <span className="text-xs font-semibold tracking-widest text-gray-500">
                  HOTEL
                </span>
              </div>
            </div>

            {/* Animated Slogan */}
            <div className="relative h-6 w-[320px] overflow-hidden hidden sm:block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ x: 120, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -120, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute left-0 top-0"
                >
                  <span className="text-sm font-semibold bg-linear-to-r from-red-600 via-orange-500 to-purple-600 bg-clip-text text-transparent">
                    {SLOGANS[index]}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </Link>

          {/* ---------- Navigation ---------- */}
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Rooms
            </Link>

            <Link
              to="/about-environment"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              About & Environment
            </Link>

            <Link
              to="/admin/login"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-primary-800"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------- Page Content ---------- */}
      <Outlet />
    </div>
  );
}
