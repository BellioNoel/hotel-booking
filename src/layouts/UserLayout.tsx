/** src/layouts/UserLayout.tsx
 * Layout wrapper for user-facing pages.
 * Provides a main content area with proper spacing.
 */
import { Outlet } from "react-router-dom";
import { LoaderContext } from "../pages/LoaderContext";
import { useContext } from "react";

export default function UserLayout() {
  const { isLoading } = useContext(LoaderContext);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Main Content */}
      <main className="w-full">
        <Outlet />
      </main>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
