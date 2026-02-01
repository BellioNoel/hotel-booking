/**src/components/RoomCards.tsx
 * Room card: image, name, price, description, and Book CTA.
 * Production-ready, accessible, theme-aware.
 */
import { useState } from "react";
import type { Room } from "../types";

export interface RoomCardProps {
  room: Room;
  onBook?: (room: Room) => void;
  /** Optional: show compact layout (e.g. in sidebar). */
  compact?: boolean;
}

export default function RoomCard({ room, onBook, compact = false }: RoomCardProps) {
  const imageUrl = room.images[0] ?? null;
  const [expanded, setExpanded] = useState(false);

  const priceFormatted = new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(room.price)
    .replace("FCFA", "FCFA"); // ensure familiar label

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300/80"
      aria-labelledby={`room-name-${room.id}`}
    >
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <span className="text-sm font-medium">No image</span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
          {priceFormatted}
          <span className="ml-0.5 font-normal text-gray-500">/ night</span>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5 sm:p-6"}`}
      >
        <h2
          id={`room-name-${room.id}`}
          className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl"
        >
          {room.name}
        </h2>

        {/* Description container (fixed visual height) */}
        <div className="mt-2">
          <p
            className={`text-gray-600 text-sm leading-relaxed transition-all ${
              expanded
                ? "max-h-40 overflow-y-auto"
                : compact
                ? "line-clamp-2"
                : "line-clamp-3 sm:line-clamp-4"
            }`}
          >
            {room.description || "A comfortable stay awaits."}
          </p>

          {/* Read more / less */}
          {!compact && room.description && room.description.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-primary-600 hover:text-primary-700 focus:outline-none"
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {onBook && (
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={() => onBook(room)}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-primary-800"
            >
              Book this room
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
