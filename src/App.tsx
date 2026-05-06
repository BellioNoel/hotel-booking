/** src/App.tsx
 * Main app entry with routing.
 * Wraps everything in LoaderProvider for global loading spinner and AuthProvider for authentication.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { createContext, useMemo, useState, useCallback } from "react";
import { LoaderProvider } from "./pages/LoaderContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

import Navigation from "./components/Navigation";
import AuthModal from "./components/AuthModal";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import User from "./pages/User";
import AboutEnvironment from "./pages/AboutEnvironment";
import Admin from "./pages/Admin";
import AdminAboutEnvironment from "./components/AdminAboutEnvironment";
import Profile from "./components/Profile";
import MyBookings from "./components/MyBookings";
import RoomDetail from "./components/RoomDetail";
import LandingPage from "./pages/Landing"; // landing page

/* ------------------------------------------------------------------
   Landing language context (English / French)
------------------------------------------------------------------- */
export type LandingLanguage = "en" | "fr";

export const LandingLanguageContext = createContext<{
  language: LandingLanguage;
  toggleLanguage: () => void;
}>({
  language: "en",
  toggleLanguage: () => {},
});

function App() {
  const [language, setLanguage] = useState<LandingLanguage>("en");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "fr" : "en"));
  }, []);

  const languageContextValue = useMemo(
    () => ({
      language,
      toggleLanguage,
    }),
    [language]
  );

  return (
    <ToastProvider>
      <AuthProvider>
        <LoaderProvider>
          <LandingLanguageContext.Provider value={languageContextValue}>
            <div className="min-h-screen">
              <Navigation onOpenAuth={() => setIsAuthModalOpen(true)} />
              
              <main className="pt-16">
                <Routes>
                  {/* Landing page always appears first */}
                  <Route path="/" element={<LandingPage />} />

                  {/* User routes */}
                  <Route path="/" element={<UserLayout />}>
                    <Route path="booking" element={<User />} />
                    <Route path="about-environment" element={<AboutEnvironment />} />
                    <Route path="rooms" element={<User />} />
                    <Route path="rooms/:roomId" element={<RoomDetail />} />
                  </Route>

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Admin />} />
                    <Route
                      path="about-environment"
                      element={<AdminAboutEnvironment />}
                    />
                  </Route>

                  {/* New authenticated routes */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-bookings" element={<MyBookings />} />

                  {/* Fallback for unknown routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>

            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
            />
          </LandingLanguageContext.Provider>
        </LoaderProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
