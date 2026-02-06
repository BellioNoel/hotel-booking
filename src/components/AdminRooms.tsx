/**
 * src/components/AdminRooms.tsx
 * Admin rooms: list, add, edit, delete.
 * Images stored as URLs (Cloudinary).
 */
import { useState, useEffect, useCallback } from "react";
import type { Room } from "../types";
import {
  getRooms,
  saveRoom,
  deleteRoom,
  generateId,
} from "../lib/firestoreStorage";

/* =========================
   Cloudinary config (INLINE)
   ========================= */
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/ddl2f55by/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hotel_uploads";

/** Upload a single image to Cloudinary */
async function uploadImage(file: File): Promise<string> {
  console.log("[Cloudinary] Uploading file:", file.name);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.error("[Cloudinary] Upload failed", res);
    throw new Error("Cloudinary upload failed");
  }

  const data = await res.json();
  console.log("[Cloudinary] Uploaded URL:", data.secure_url);

  return data.secure_url as string;
}

/** Upload multiple images to Cloudinary */
async function uploadImages(files: FileList | null): Promise<string[]> {
  if (!files?.length) return [];
  return Promise.all(Array.from(files).map(uploadImage));
}

const emptyRoomForm = {
  name: "",
  price: "",
  description: "",
  images: [] as string[],
};

type RoomFormState = typeof emptyRoomForm;

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<RoomFormState>(emptyRoomForm);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function openAdd() {
    setEditingRoom(null);
    setForm(emptyRoomForm);
    setImageFiles(null);
    setIsAddOpen(true);
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setForm({
      name: room.name,
      price: String(room.price),
      description: room.description,
      images: [...room.images],
    });
    setImageFiles(null);
    setIsAddOpen(false);
  }

  function closeModal() {
    setEditingRoom(null);
    setIsAddOpen(false);
    setForm(emptyRoomForm);
    setImageFiles(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const description = form.description.trim();

    if (!name || Number.isNaN(price) || price < 0) return;

    const roomId = editingRoom ? editingRoom.id : generateId();
    let images = [...form.images];

    if (imageFiles?.length) {
      console.log("[Rooms] Uploading images to Cloudinary…");
      const uploaded = await uploadImages(imageFiles);
      images = [...images, ...uploaded];
    }

    if (editingRoom) {
      await saveRoom({
        ...editingRoom,
        name,
        price,
        description,
        images,
      });
    } else {
      await saveRoom({
        id: roomId,
        name,
        price,
        description,
        images,
      });
    }

    await loadRooms();
    closeModal();
  }

  async function handleDelete(id: string) {
    await deleteRoom(id);
    setDeleteConfirmId(null);
    loadRooms();
  }

  const isModalOpen = isAddOpen || editingRoom !== null;
  const modalTitle = editingRoom ? "Edit room" : "Add room";

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Rooms</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + Add room
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading rooms…</p>}

      {!loading && rooms.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-gray-700 font-medium">No rooms yet</p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="aspect-4/3 bg-gray-100">
                {room.images[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  FCFA{room.price.toLocaleString()} / night
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {room.description}
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(room)}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                  >
                    Edit
                  </button>

                  {deleteConfirmId === room.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(room.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white">
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Room name"
                required
              />

              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="Price per night"
                required
              />

              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description"
              />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(e.target.files)}
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit">
                  {editingRoom ? "Save changes" : "Add room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
