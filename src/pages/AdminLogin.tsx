/**src/lib/AdminLogin.tsx
 * Admin login: hardcoded credentials, sets admin key and redirects to /admin.
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setAdminKey, getAdminKey } from "../lib/storage";

const ADMIN_USERNAME = "HotelAdmin";
const ADMIN_PASSWORD = "HotelFrontend";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in: redirect to admin
  useEffect(() => {
    if (getAdminKey()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const u = username.trim();
    const p = password;

    if (u !== ADMIN_USERNAME || p !== ADMIN_PASSWORD) {
      setError("Invalid username or password.");
      setSubmitting(false);
      // Fallback to rooms page on failed login
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return;
    }

    setAdminKey("authenticated");
    setSubmitting(false);
    navigate("/admin", { replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage rooms and bookings.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Password"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
              <p className="mt-1 text-xs text-red-600">Redirecting to rooms page...</p>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            ← Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
