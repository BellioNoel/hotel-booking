import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { roomsAPI, handleAPIRequest } from "../lib/api";
import type { Room } from "../types";
import RoomCard from "../components/RoomCard";

const content = {
  en: {
    title: "Luxury Stays Above Expectations",
    subtitle:
      "Discover refined comfort, curated rooms, and seamless booking in one place.",
    ctaPrimary: "Explore Rooms",
    ctaSecondary: "Book Instantly",
    sectionTitle: "Featured Rooms",
    sectionCopy: "Handpicked rooms ready for your next unforgettable stay.",
    trustLine: "Trusted by travelers seeking calm, style, and reliability.",
  },
  fr: {
    title: "Des Sejours de Luxe au-Dela des Attentes",
    subtitle:
      "Decouvrez un confort raffine, des chambres soigneusement choisies et une reservation fluide.",
    ctaPrimary: "Voir les Chambres",
    ctaSecondary: "Reserver Maintenant",
    sectionTitle: "Chambres en Vedette",
    sectionCopy: "Des chambres selectionnees pour votre prochain sejour inoubliable.",
    trustLine: "Adopte par des voyageurs en quete de calme, style et fiabilite.",
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const t = content[lang];

  useEffect(() => {
    document.title = "Franco Hotel | Premium Stays";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRooms() {
      setLoadingRooms(true);
      const { data } = await handleAPIRequest(() => roomsAPI.getRooms({ limit: 6 }));
      if (!active) return;
      setRooms(data?.rooms || []);
      setLoadingRooms(false);
    }

    loadRooms();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-transparent text-[#f8f4ef]">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(20,7,12,0.85), rgba(20,7,12,0.35) 45%, rgba(20,7,12,0.65)), url('/og-image.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-accent-lime-500/20 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-primary-600/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-end gap-2">
            <button
              onClick={() => setLang("en")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                lang === "en" ? "bg-accent-lime-500 text-[#2b0818]" : "bg-white/15 text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("fr")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                lang === "fr" ? "bg-accent-lime-500 text-[#2b0818]" : "bg-white/15 text-white"
              }`}
            >
              FR
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-3xl"
          >
            <p className="mb-4 inline-flex rounded-full border border-accent-lime-500/50 bg-accent-lime-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7f29f]">
              Franco Hotel
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-[#f8f4ef]/90 sm:text-base">
              {t.subtitle}
            </p>
            <p className="mt-4 text-sm text-[#d7f29f]">{t.trustLine}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/booking")}
                className="rounded-xl bg-accent-lime-500 px-6 py-3 text-sm font-bold text-[#2b0818] transition hover:bg-accent-lime-300"
              >
                {t.ctaSecondary}
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("landing-rooms");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {t.ctaPrimary}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="landing-rooms" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#f8f4ef] sm:text-3xl">{t.sectionTitle}</h2>
            <p className="mt-2 text-sm text-[#f8f4ef]/75">{t.sectionCopy}</p>
          </div>
          <button
            onClick={() => navigate("/booking")}
            className="w-fit rounded-lg border border-accent-lime-500/40 bg-primary-600/70 px-4 py-2 text-sm font-semibold text-[#d7f29f] transition hover:bg-primary-600"
          >
            View All Rooms
          </button>
        </div>

        {loadingRooms ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-8 py-12 text-center text-[#f8f4ef]/70">
            No rooms are available yet.
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, idx) => (
              <motion.li
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06, duration: 0.45 }}
                className="rounded-2xl"
              >
                <RoomCard room={room} onBook={() => navigate(`/rooms/${room.id}`)} />
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
