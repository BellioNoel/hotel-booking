//src/pages/AboutEnvironment.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { configAPI } from "../lib/api";

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
      try {
        const aboutData = await configAPI.getAboutPage();
        if (aboutData) {
          setData(aboutData as AboutPageData);
          return;
        }
      } catch (error) {
        console.warn('Failed to load about page from backend config API:', error);
      }

      setData({
        hero: {
          id: '1',
          title: 'About Our Hotel',
          description: 'Experience luxury and comfort at our beautiful hotel.',
          image: '/api/placeholder/800/400'
        },
        cards: []
      });
    })();
  }, []);

  if (!data) return null;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#1a0710] via-[#2b0818] to-[#12050c] text-[#f8f4ef]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-[#2a0e1a]/85 shadow-xl"
        >
          {data.hero.image && (
            <img
              src={data.hero.image}
              alt={data.hero.title}
              className="w-full h-64 sm:h-72 md:h-96 object-cover transition-transform duration-500 ease-in-out hover:scale-105"
            />
          )}
          <div className="p-6 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#f8f4ef]">
              {data.hero.title}
            </h1>
            <p className="mt-4 text-sm text-[#f8f4ef]/75 sm:text-base md:text-lg">
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
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#2a0e1a]/85 shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-xl"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-48 sm:h-56 w-full object-cover transition-transform duration-500 ease-in-out"
                />
              )}
              <div className="p-4 sm:p-6">
                <h3 className="line-clamp-2 text-lg font-semibold text-[#f8f4ef] sm:text-xl">
                  {card.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-[#f8f4ef]/70 sm:text-base">
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
