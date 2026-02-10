/**
 * Landing page: first impression of the hotel system.
 * SEO-ready, mobile-first, animated, and fully aligned with app color palette.
 * Multilingual: English / French (no external i18n dependency).
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLoader } from "../pages/LoaderContext";

/* ---------- TRANSLATIONS ---------- */
const content = {
  en: {
    seoTitle: "Franc Hotel — Comfort, Elegance & Easy Booking",
    seoDescription:
      "Franc Hotel offers comfortable rooms, elegant design, and fast secure booking. Experience a peaceful stay designed around you.",

    heroTitle: "Your Home Away From Home",
    heroText:
      "Enjoy comfort, calm, and simplicity in a space designed for rest. Book easily, arrive confidently, and relax completely.",

    ctaBook: "Start Booking",
    ctaAbout: "About Us",
    ctaContact: "Contact Us",

    features: [
      {
        title: "Comfort First",
        text: "Quiet rooms, clean spaces, and thoughtful design for real rest.",
      },
      {
        title: "Easy Booking",
        text: "Book in minutes with a smooth, secure, and reliable process.",
      },
      {
        title: "Peaceful Environment",
        text: "A calm atmosphere perfect for business or relaxation.",
      },
    ],

    contactTitle: "Contact Us",
    contactText: "We’re here to help. Reach us instantly using any option below.",

    finalTitle: "Ready to book your stay?",
    finalCta: "Book a Room Now",
  },

  fr: {
    seoTitle: "Franc Hôtel — Confort, Élégance & Réservation Facile",
    seoDescription:
      "Franc Hôtel propose des chambres confortables, un design élégant et une réservation rapide et sécurisée. Profitez d’un séjour paisible conçu pour vous.",

    heroTitle: "Votre Maison Loin de Chez Vous",
    heroText:
      "Profitez du confort, du calme et de la simplicité dans un espace pensé pour le repos. Réservez facilement, arrivez sereinement et détendez-vous.",

    ctaBook: "Réserver",
    ctaAbout: "À Propos",
    ctaContact: "Nous Contacter",

    features: [
      {
        title: "Confort Absolu",
        text: "Des chambres calmes, propres et conçues pour un vrai repos.",
      },
      {
        title: "Réservation Simple",
        text: "Réservez en quelques minutes avec un processus fluide et sécurisé.",
      },
      {
        title: "Environnement Paisible",
        text: "Une atmosphère idéale pour le travail ou la détente.",
      },
    ],

    contactTitle: "Contactez-nous",
    contactText:
      "Nous sommes disponibles pour vous aider. Contactez-nous via l’un des moyens ci-dessous.",

    finalTitle: "Prêt à réserver votre séjour ?",
    finalCta: "Réserver une Chambre",
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const [lang, setLang] = useState<"en" | "fr">("en");

  const t = content[lang];

  /* ---------- SEO META SETUP ---------- */
  useEffect(() => {
    document.title = t.seoTitle;

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }

    metaDescription.content = t.seoDescription;
  }, [lang, t]);

  /* ---------- SAFE NAVIGATION WITH LOADER ---------- */
  function goTo(path: string) {
    showLoader();
    requestAnimationFrame(() => {
      navigate(path);
      hideLoader();
    });
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ---------- LANGUAGE SWITCH ---------- */}
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <button
          onClick={() => setLang("en")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            lang === "en"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang("fr")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            lang === "fr"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          FR
        </button>
      </div>

      {/* ---------- HERO ---------- */}
      <section className="px-5 pt-28 pb-20 text-center sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
        >
          {t.heroTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto mt-4 max-w-xl text-sm text-gray-600 sm:text-base"
        >
          {t.heroText}
        </motion.p>

        {/* ---------- CTA BUTTONS ---------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => goTo("/booking")}
            className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            {t.ctaBook}
          </button>

          <button
            onClick={() => goTo("/about-environment")}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            {t.ctaAbout}
          </button>

          <a
            href="#contact"
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            {t.ctaContact}
          </a>
        </motion.div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- CONTACT ---------- */}
      <section
        id="contact"
        className="border-t border-gray-200 bg-gray-100 px-5 py-16 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            {t.contactTitle}
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            {t.contactText}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="mailto:noeltebei478@gmail.com"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              📧 Email
            </a>

            <a
              href="https://wa.me/237678507737"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              💬 WhatsApp
            </a>

            <a
              href="tel:+237678507737"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              📞 Call
            </a>
          </div>
        </motion.div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="px-5 py-20 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {t.finalTitle}
          </h3>

          <button
            onClick={() => goTo("/booking")}
            className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:scale-[1.03] active:scale-95"
          >
            {t.finalCta}
          </button>
        </motion.div>
      </section>
    </main>
  );
}
