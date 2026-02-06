import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const ABOUT_DOC_REF = doc(db, "config", "aboutPage");

interface AboutCard {
  id: string;
  title: string;
  description: string;
  image: string; // URL (Cloudinary)
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

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/ddl2f55by/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hotel_uploads";

export default function AdminAboutEnvironment() {
  const [data, setData] = useState<AboutPageData>({
    hero: emptyCard(),
    cards: [],
  });

  useEffect(() => {
    (async () => {
      const snap = await getDoc(ABOUT_DOC_REF);
      if (snap.exists()) {
        setData(snap.data() as AboutPageData);
      }
    })();
  }, []);

  async function save(updated: AboutPageData) {
    setData(updated);
    await setDoc(ABOUT_DOC_REF, updated);
  }

  /** Upload image to Cloudinary and return secure URL */
  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url as string;
  }

  async function updateHeroImage(file: File) {
    const url = await uploadImage(file);

    save({
      ...data,
      hero: { ...data.hero, image: url },
    });
  }

  async function updateCardImage(cardId: string, file: File) {
    const url = await uploadImage(file);

    save({
      ...data,
      cards: data.cards.map((c) =>
        c.id === cardId ? { ...c, image: url } : c
      ),
    });
  }

  function updateHero(field: keyof AboutCard, value: string) {
    save({ ...data, hero: { ...data.hero, [field]: value } });
  }

  function updateCard(id: string, field: keyof AboutCard, value: string) {
    save({
      ...data,
      cards: data.cards.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Hotel About Page Builder</h1>

      {/* HERO */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold mb-4">Hero Section</h2>

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

            <button
              onClick={() =>
                save({
                  ...data,
                  cards: data.cards.filter((c) => c.id !== card.id),
                })
              }
              className="mt-3 text-red-600 text-sm"
            >
              Delete Card
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          save({ ...data, cards: [...data.cards, emptyCard()] })
        }
        className="bg-blue-600 text-white px-6 py-2 rounded-xl"
      >
        Add New Card
      </button>
    </div>
  );
}
