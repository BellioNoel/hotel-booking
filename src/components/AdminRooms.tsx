/**
 * src/components/AdminRoome.tsx
 * Admin rooms: list, add, edit, delete. Images stored as base64.
 */
import { useState, useEffect, useCallback } from "react";
import type { Room } from "../types";
import {
  getRooms,
  saveRoom,
  deleteRoom,
  generateId,
} from "../lib/storage";

/** Converts File to base64 data URL. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Converts multiple files to base64 data URLs. */
async function filesToDataUrls(files: FileList | null): Promise<string[]> {
  if (!files?.length) return [];
  const results = await Promise.all(Array.from(files).map(fileToDataUrl));
  return results;
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

  const loadRooms = useCallback(() => setRooms(getRooms()), []);

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

    let images = [...form.images];
    if (imageFiles?.length) {
      const newUrls = await filesToDataUrls(imageFiles);
      images = [...images, ...newUrls];
    }
    if (images.length === 0) images = []; // allow no images

    if (editingRoom) {
      saveRoom({
        ...editingRoom,
        name,
        price,
        description,
        images,
      });
    } else {
      saveRoom({
        id: generateId(),
        name,
        price,
        description,
        images,
      });
    }
    loadRooms();
    closeModal();
  }

  function handleDelete(id: string) {
    deleteRoom(id);
    setDeleteConfirmId(null);
    loadRooms();
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          + Add room
        </button>
      </div>

      {/* Empty state */}
      {rooms.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-gray-700 font-medium">No rooms yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Click “Add room” to create your first listing.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
            >
              {/* Image */}
              <div className="aspect-4/3 overflow-hidden bg-gray-100">
                {room.images[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {room.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  ${room.price.toLocaleString()} / night
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {room.description}
                </p>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(room)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  {deleteConfirmId === room.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(room.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
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

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per night
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>

                {form.images.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          alt=""
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-xs text-white hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(e.target.files)}
                  className="block w-full text-sm text-gray-600"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
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
