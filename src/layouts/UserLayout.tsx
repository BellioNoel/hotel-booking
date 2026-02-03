/**src/components/UserLayout.tsx
 * Layout for the user-facing app: header + outlet.
 * Wraps all routes under the public booking flow.
 */
import { Outlet, Link } from "react-router-dom";

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            FRANCO HOTEL
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Rooms
            </Link>

            {/* About / Environment */}
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

      <Outlet />
    </div>
  );
}
