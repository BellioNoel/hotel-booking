/**src/components/RoomCards.tsx
 * Room card: image, name, price, description, and Book CTA.
 * Production-ready, accessible, theme-aware.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../types";

export interface RoomCardProps {
  room: Room;
  onBook?: (room: Room) => void;
  /** Optional: show compact layout (e.g. in sidebar). */
  compact?: boolean;
}

export default function RoomCard({ room, onBook, compact = false }: RoomCardProps) {
  const navigate = useNavigate();
  const imageUrl = room.images[0]?.url ?? null;
  const [expanded, setExpanded] = useState(false);

  // Rating display component
  const RatingStars = ({ rating, count }: { rating: number; count: number }) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <span className="text-xs text-[#f8f4ef]/70">({count})</span>
      </div>
    );
  };

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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2a0e1a]/85 shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer"
      aria-labelledby={`room-name-${room.id}`}
      onClick={() => navigate(`/rooms/${room.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#15070d]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#f8f4ef]/50">
            <span className="text-sm font-medium">No image</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 rounded-lg border border-accent-lime-500/35 bg-[#1b0a11]/80 px-3 py-1.5 text-sm font-semibold text-[#d7f29f] shadow-sm backdrop-blur-sm">
          {priceFormatted}
          <span className="ml-0.5 font-normal text-[#f8f4ef]/70">/ night</span>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5 sm:p-6"}`}
      >
        <h2
          id={`room-name-${room.id}`}
          className="text-lg font-semibold tracking-tight text-[#f8f4ef] sm:text-xl"
        >
          {room.name}
        </h2>

        {/* Rating */}
        <div className="mt-1">
          <RatingStars rating={room.rating?.average || 0} count={room.rating?.count || 0} />
        </div>

        {/* Description container (fixed visual height) */}
        <div className="mt-2">
          <p
            className={`text-[#f8f4ef]/75 text-sm leading-relaxed transition-all ${
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
              className="mt-1 text-xs font-medium text-accent-lime-500 hover:text-accent-lime-300 focus:outline-none"
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
            className="
              w-full rounded-xl
              bg-accent-lime-500
              px-4 py-3
              text-sm font-bold text-[#2b0818]
              shadow-md
              transition-all duration-300 ease-out
              hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-accent-lime-300 hover:shadow-xl
              active:translate-y-0 active:scale-[0.98] active:bg-accent-lime-500
              focus:outline-none focus:ring-2 focus:ring-accent-lime-500 focus:ring-offset-2
            "
          >
            Book this room
          </button>
        </div>
        
        )}
      </div>
    </article>
  );
}
