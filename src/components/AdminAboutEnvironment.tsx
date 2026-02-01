import { useEffect, useState } from "react";

const STORAGE_KEY = "hotel_about_page";

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

export default function AdminAboutPage() {
  const [data, setData] = useState<AboutPageData>({
    hero: emptyCard(),
    cards: [],
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setData(JSON.parse(raw));
  }, []);

  function save(updated: AboutPageData) {
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function fileToBase64(file: File) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  function updateHero(field: keyof AboutCard, value: string) {
    save({ ...data, hero: { ...data.hero, [field]: value } });
  }

  function updateCard(id: string, field: keyof AboutCard, value: string) {
    save({
      ...data,
      cards: data.cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Hotel About Page Builder</h1>

      {/* HERO CARD */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold mb-4">Hero Card (Hotel Name)</h2>

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
          onChange={async (e) => {
            if (!e.target.files) return;
            updateHero("image", await fileToBase64(e.target.files[0]));
          }}
        />

        {data.hero.image && (
          <img src={data.hero.image} className="mt-4 rounded-lg h-40 object-cover" />
        )}
      </div>

      {/* CARDS */}
      <div className="space-y-6">
        {data.cards.map((card) => (
          <div key={card.id} className="bg-white p-6 rounded-xl shadow">
            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Card title"
              value={card.title}
              onChange={(e) => updateCard(card.id, "title", e.target.value)}
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Card description"
              value={card.description}
              onChange={(e) => updateCard(card.id, "description", e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files) return;
                updateCard(card.id, "image", await fileToBase64(e.target.files[0]));
              }}
            />

            {card.image && <img src={card.image} className="mt-4 h-32 rounded object-cover" />}

            <button
              onClick={() => save({ ...data, cards: data.cards.filter((c) => c.id !== card.id) })}
              className="mt-3 text-red-600 text-sm"
            >
              Delete Card
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => save({ ...data, cards: [...data.cards, emptyCard()] })}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl"
      >
        Add New Card
      </button>
    </div>
  );
}
