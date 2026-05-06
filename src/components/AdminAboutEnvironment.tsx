import { useEffect, useState } from "react";
import { configAPI, uploadAPI } from "../lib/api";

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

const emptyCard = (): AboutCard => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  image: "",
});

export default function AdminAboutEnvironment() {
  const [data, setData] = useState<AboutPageData>({
    hero: emptyCard(),
    cards: [],
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const aboutData = await configAPI.getAboutPage();
        if (aboutData) {
          setData(aboutData);
        }
      } catch (error) {
        console.error('Failed to load about page data:', error);
      }
    })();
  }, []);

  async function save(sectionId: string, updated: AboutPageData) {
    try {
      setSaving(sectionId);
      setData(updated);
      await configAPI.updateAboutPage(updated);
    } catch (error) {
      console.error('Failed to save about page data:', error);
    } finally {
      setSaving(null);
    }
  }

  /** Upload image to backend storage provider (Cloudinary) and return URL */
  async function uploadImage(file: File): Promise<string> {
    const res = await uploadAPI.uploadImage(file);
    return res?.image?.url || "";
  }

  async function updateHeroImage(file: File) {
    const url = await uploadImage(file);
    setData({
      ...data,
      hero: { ...data.hero, image: url },
    });
  }

  async function updateCardImage(cardId: string, file: File) {
    const url = await uploadImage(file);
    setData({
      ...data,
      cards: data.cards.map((c) =>
        c.id === cardId ? { ...c, image: url } : c
      ),
    });
  }

  function updateHero(field: keyof AboutCard, value: string) {
    setData({ ...data, hero: { ...data.hero, [field]: value } });
  }

  function updateCard(id: string, field: keyof AboutCard, value: string) {
    setData({
      ...data,
      cards: data.cards.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  }

  function saveHero() {
    save('hero', data);
  }

  function saveCard(cardId: string) {
    save(cardId, data);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Hotel About Page Builder</h1>

      {/* HERO */}
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Hero Section</h2>
          <button
            onClick={saveHero}
            disabled={saving === 'hero'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving === 'hero' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Hero
              </>
            )}
          </button>
        </div>

        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="Hotel Name"
          value={data.hero.title}
          onChange={(e) => updateHero("title", e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded mb-2"
          placeholder="Hotel Description"
          value={data.hero.description}
          onChange={(e) => updateHero("description", e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              updateHeroImage(e.target.files[0]);
            }
          }}
        />

        {data.hero.image && (
          <img
            src={data.hero.image}
            className="mt-4 h-40 rounded-lg object-cover"
          />
        )}
      </div>

      {/* CARDS */}
      <div className="space-y-6">
        {data.cards.map((card) => (
          <div key={card.id} className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Card Section</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => saveCard(card.id)}
                  disabled={saving === card.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving === card.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Card
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    setData({
                      ...data,
                      cards: data.cards.filter((c) => c.id !== card.id),
                    })
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Card title"
              value={card.title}
              onChange={(e) =>
                updateCard(card.id, "title", e.target.value)
              }
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Card description"
              value={card.description}
              onChange={(e) =>
                updateCard(card.id, "description", e.target.value)
              }
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  updateCardImage(card.id, e.target.files[0]);
                }
              }}
            />

            {card.image && (
              <img
                src={card.image}
                className="mt-4 h-32 rounded object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          setData({ ...data, cards: [...data.cards, emptyCard()] })
        }
        className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add New Card
      </button>
    </div>
  );
}
