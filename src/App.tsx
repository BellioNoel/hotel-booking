// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import User from "./pages/User";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AboutEnvironment from "./pages/AboutEnvironment"; // user version
import AdminAboutEnvironment from "./components/AdminAboutEnvironment"; // admin version

function App() {
  return (
    <Routes>
      {/* User routes */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<User />} />
        <Route path="about-environment" element={<AboutEnvironment />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Admin />} />
        <Route path="about-environment" element={<AdminAboutEnvironment />} />
      </Route>

      {/* Admin login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
