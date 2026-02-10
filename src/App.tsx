/** src/App.tsx
 * Main app entry with routing.
 * Wraps everything in LoaderProvider for global loading spinner.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { createContext, useMemo, useState } from "react";
import { LoaderProvider } from "./pages/LoaderContext";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import User from "./pages/User";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AboutEnvironment from "./pages/AboutEnvironment"; // user version
import AdminAboutEnvironment from "./components/AdminAboutEnvironment"; // admin version
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

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "fr" : "en"));
  };

  const languageContextValue = useMemo(
    () => ({
      language,
      toggleLanguage,
    }),
    [language]
  );

  return (
    <LoaderProvider>
      <LandingLanguageContext.Provider value={languageContextValue}>
        <Routes>
          {/* Landing page always appears first */}
          <Route path="/" element={<LandingPage />} />

          {/* User routes */}
          <Route path="/" element={<UserLayout />}>
            <Route path="booking" element={<User />} />
            <Route path="about-environment" element={<AboutEnvironment />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
            <Route
              path="about-environment"
              element={<AdminAboutEnvironment />}
            />
          </Route>

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LandingLanguageContext.Provider>
    </LoaderProvider>
  );
}

export default App;
