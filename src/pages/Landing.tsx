/**
 * Landing page: first impression of the hotel system.
 * SEO-ready, mobile-first, animated, and fully aligned with app color palette.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoader } from "../pages/LoaderContext";

export default function Landing() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  /* ---------- SEO META SETUP ---------- */
  useEffect(() => {
    document.title = "Franc Hotel — Comfort, Elegance & Easy Booking";

    const metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Franc Hotel offers comfortable rooms, elegant design, and fast secure booking. Experience a peaceful stay designed around you."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "Franc Hotel offers comfortable rooms, elegant design, and fast secure booking. Experience a peaceful stay designed around you.";
      document.head.appendChild(meta);
    }
  }, []);

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
      {/* ---------- HERO ---------- */}
      <section className="px-5 pt-28 pb-20 text-center sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
        >
          Your Home Away From Home
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto mt-4 max-w-xl text-sm text-gray-600 sm:text-base"
        >
          Enjoy comfort, calm, and simplicity in a space designed for rest.
          Book easily, arrive confidently, and relax completely.
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
            className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-95 sm:w-auto"
          >
            Start Booking
          </button>

          <button
            onClick={() => goTo("/about-environment")}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            About Us
          </button>

          <a
            href="#contact"
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            Contact Us
          </a>
        </motion.div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
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
          ].map((item, i) => (
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

      {/* ---------- CONTACT US ---------- */}
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
            Contact Us
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            We’re here to help. Reach us instantly using any option below.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="mailto:noeltebei478@gmail.com"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-100"
            >
              📧 Email
            </a>

            <a
              href="https://wa.me/237678507737"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-100"
            >
              💬 WhatsApp
            </a>

            <a
              href="tel:+237678507737"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-100"
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
            Ready to book your stay?
          </h3>

          <button
            onClick={() => goTo("/booking")}
            className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:scale-[1.03] active:scale-95"
          >
            Book a Room Now
          </button>
        </motion.div>
      </section>
    </main>
  );
}
