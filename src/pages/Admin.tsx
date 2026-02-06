/**
 * Admin page: rooms CRUD and bookings management (tabs).
 */
import { useCallback, useState } from "react";
import AdminRooms from "../components/AdminRooms";
import AdminBookings from "../components/AdminBookings";
import AdminAboutEnvironment from "../components/AdminAboutEnvironment";

type TabId = "rooms" | "bookings" | "about";

const tabs: { id: TabId; label: string }[] = [
  { id: "rooms", label: "Rooms" },
  { id: "bookings", label: "Bookings" },
  { id: "about", label: "About / Environment" },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabId>("rooms");

  /**
   * Cloudinary image upload handler
   * Logic preserved exactly as provided
   */
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;

      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("upload_preset", "hotel_uploads");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/ddl2f55by/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log("Uploaded URL:", data.secure_url);
    },
    []
  );

  return (
    <main className="flex-1 sm:p-6 [padding:var(--spacing-page)]">
      <div className="max-w-6xl mx-auto">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6" role="tablist" aria-label="Admin sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div
          id="panel-rooms"
          role="tabpanel"
          aria-labelledby="tab-rooms"
          hidden={activeTab !== "rooms"}
          className="focus:outline-none"
        >
          {activeTab === "rooms" && <AdminRooms />}
        </div>

        <div
          id="panel-bookings"
          role="tabpanel"
          aria-labelledby="tab-bookings"
          hidden={activeTab !== "bookings"}
          className="focus:outline-none"
        >
          {activeTab === "bookings" && <AdminBookings />}
        </div>

        <div
          id="panel-about"
          role="tabpanel"
          aria-labelledby="tab-about"
          hidden={activeTab !== "about"}
          className="focus:outline-none"
        >
          {activeTab === "about" && (
            <>
              <AdminAboutEnvironment />

              {/* Image upload intentionally scoped to About / Environment */}
              <div className="mt-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
