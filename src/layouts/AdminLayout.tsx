/**src/components/AdminLayout.tsx
 * Layout for the admin area: protected by admin key, header + outlet.
 * Redirects to /admin/login when no admin key is stored.
 */
import { Outlet, Navigate, Link, useNavigate } from "react-router-dom";
import { getAdminKey, clearAdminKey } from "../lib/storage";

export default function AdminLayout() {
  const navigate = useNavigate();
  const adminKey = getAdminKey();

  if (!adminKey) {
    return <Navigate to="/admin/login" replace />;
  }

  function handleLogout() {
    clearAdminKey();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-semibold text-gray-900">
            Admin
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              View site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
