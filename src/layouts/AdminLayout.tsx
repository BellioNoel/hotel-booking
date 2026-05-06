/**src/components/AdminLayout.tsx
 * Layout for the admin area: protected by authentication, header + outlet.
 * Redirects to / when user is not authenticated or not an admin.
 */
import { Outlet, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  function handleLogout() {
    logout();
  }

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 w-full">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Admin
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 sm:gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/admin/bookings" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Bookings
            </Link>
            <Link to="/admin/add-room" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Add Room
            </Link>
            <Link to="/admin/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              About
            </Link>
            <Link to="/admin/profile" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Profile
            </Link>
            <Link to="/rooms" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              View Rooms
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log out
            </button>
          </nav>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-2 space-y-1">
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/bookings"
                className="block px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Bookings
              </Link>
              <Link
                to="/admin/add-room"
                className="block px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Add Room
              </Link>
              <Link
                to="/admin/about"
                className="block px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/admin/profile"
                className="block px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/rooms"
                className="block px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                View Rooms
              </Link>
              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  Log out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
