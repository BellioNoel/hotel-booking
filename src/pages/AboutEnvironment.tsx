import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const ABOUT_DOC_REF = doc(db, "config", "aboutPage");

interface AboutCard {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface AboutPageData {
  hero: AboutCard;
  cards: AboutCard[];
}

export default function AboutPage() {
  const [data, setData] = useState<AboutPageData | null>(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(ABOUT_DOC_REF);
      if (snap.exists()) {
        setData(snap.data() as AboutPageData);
      }
    })();
  }, []);

  if (!data) return null;

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {data.hero.image && (
            <img
              src={data.hero.image}
              alt={data.hero.title}
              className="w-full h-64 sm:h-72 md:h-96 object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            />
          )}
          <div className="p-6 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {data.hero.title}
            </h1>
            <p className="mt-4 text-gray-600 text-sm sm:text-base md:text-lg">
              {data.hero.description}
            </p>
          </div>
        </motion.div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {data.cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:scale-105 hover:shadow-xl transition-transform duration-300"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-48 sm:h-56 w-full object-cover transition-transform duration-500 ease-in-out"
                />
              )}
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold text-lg sm:text-xl text-gray-900 line-clamp-2">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-600 line-clamp-3">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
