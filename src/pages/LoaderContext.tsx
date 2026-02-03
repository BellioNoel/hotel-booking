/** src/components/LoaderContext.tsx
 * Global loader context for admin/user area.
 * Provides show/hide loader functions and displays a full-page overlay.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type LoaderContextType = {
  showLoader: () => void;
  hideLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

const MESSAGES = [
  "Loading…",
  "Almost there…",
  "Just a moment…",
  "Please wait…",
  "Preparing your real-time experience…",
  "Getting things ready…",
  "Hang tight…",
];

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);

  // Change message every 2 seconds when loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      const next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setMessage(next);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  const showLoader = useCallback(() => setLoading(true), []);
  const hideLoader = useCallback(() => setLoading(false), []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          {/* Spinner around building */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24">
              {/* Building SVG */}
              <svg viewBox="0 0 64 64" className="w-full h-full">
                <rect x="20" y="16" width="24" height="40" rx="2" fill="#4F46E5" />
                <rect x="26" y="22" width="4" height="4" fill="#fff" />
                <rect x="34" y="22" width="4" height="4" fill="#fff" />
                <rect x="26" y="30" width="4" height="4" fill="#fff" />
                <rect x="34" y="30" width="4" height="4" fill="#fff" />
              </svg>

              {/* Spinner ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 border-4 border-t-primary-500 border-b-primary-200 rounded-full animate-spin"></div>
              </div>
            </div>

            {/* Message */}
            <p className="text-white text-lg font-semibold text-center animate-fadeIn">
              {message}
            </p>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
};

/** Hook for easy access */
export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used within LoaderProvider");
  return ctx;
}