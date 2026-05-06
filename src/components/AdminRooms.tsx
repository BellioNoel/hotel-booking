/**
 * src/components/AdminRooms.tsx
 * Admin rooms: list, add, edit, delete.
 * Images stored as URLs (Cloudinary).
 */
import { useState, useEffect, useCallback } from "react";
import type { Room } from "../types";
import { roomsAPI, uploadAPI, handleAPIRequest } from "../lib/api";

/* =========================
   Cloudinary config (INLINE)
   ========================= */

/** Upload multiple images to Cloudinary via API */
async function uploadImages(files: FileList | null): Promise<Array<{ url: string; publicId: string }>> {
  if (!files?.length) return [];
  
  try {
    const result = await uploadAPI.uploadImages(Array.from(files));
    return result.images || [];
  } catch (error) {
    console.error("Image upload failed:", error);
    throw new Error("Failed to upload images");
  }
}

const emptyRoomForm = {
  name: "",
  price: "",
  description: "",
  roomType: "standard" as const,
  bedType: "double" as const,
  capacity: 2,
  size: "",
  petFriendly: false,
  images: [] as Array<{ url: string; publicId: string; description?: string }>,
  criteria: [] as Array<{ name: string; description: string }>,
};

type RoomFormState = typeof emptyRoomForm;

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<RoomFormState>(emptyRoomForm);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await handleAPIRequest(() => roomsAPI.getRooms());
      if (data) {
        setRooms(data.rooms);
      } else if (error) {
        console.error('Failed to load rooms:', error);
      }
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
      roomType: room.roomType || 'standard',
      bedType: room.bedType || 'double',
      capacity: room.capacity || 2,
      size: room.size ? String(room.size) : '',
      petFriendly: room.petFriendly || false,
      images: [...room.images],
      criteria: room.criteria || [],
    });
    setImageDescriptions(room.images.map(img => img.description || ''));
    setImageFiles(null);
    setIsAddOpen(false);
  }

  function closeModal() {
    setEditingRoom(null);
    setIsAddOpen(false);
    setForm(emptyRoomForm);
    setImageFiles(null);
    setImageDescriptions([]);
  }

  function addCriteria() {
    setForm(prev => ({
      ...prev,
      criteria: [...prev.criteria, { name: '', description: '' }]
    }));
  }

  function updateCriteria(index: number, field: 'name' | 'description', value: string) {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }));
  }

  function removeCriteria(index: number) {
    setForm(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  }

  function updateImageDescription(index: number, description: string) {
    setImageDescriptions(prev => {
      const newDescriptions = [...prev];
      newDescriptions[index] = description;
      return newDescriptions;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const description = form.description.trim();

    if (!name || Number.isNaN(price) || price < 0) return;

    let images = [...form.images];

    if (imageFiles?.length) {
      console.log("[Rooms] Uploading images to Cloudinary…");
      const uploaded = await uploadImages(imageFiles);
      images = [...images, ...uploaded];
    }

    const roomData: any = {
      name,
      price,
      description,
      capacity: form.capacity,
      bedType: form.bedType,
      roomType: form.roomType,
      size: form.size ? Number(form.size) : undefined,
      petFriendly: form.petFriendly,
    };

    // Only add images field if there are actual images with valid data
    if (images.length > 0) {
      roomData.images = images.map((img, index) => ({ 
        url: img.url, 
        publicId: img.publicId || '', 
        alt: 'Room image',
        description: imageDescriptions[index] || ''
      }));
    }

    // Add criteria if any
    if (form.criteria.length > 0) {
      roomData.criteria = form.criteria;
    }

    try {
      if (editingRoom) {
        await roomsAPI.updateRoom(editingRoom.id, roomData);
      } else {
        await roomsAPI.createRoom(roomData);
      }

      await loadRooms();
      closeModal();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await roomsAPI.deleteRoom(id);
      setDeleteConfirmId(null);
      loadRooms();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
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
                    src={room.images[0].url}
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
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6 p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">{modalTitle}</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="e.g., Deluxe Ocean View Room"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Night (FCFA) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      placeholder="e.g., 50000"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Describe the room, its features, and what makes it special..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Room Specifications */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Room Specifications</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Type
                      </label>
                      <select
                        value={form.roomType}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, roomType: e.target.value as any }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="standard">Standard</option>
                        <option value="deluxe">Deluxe</option>
                        <option value="suite">Suite</option>
                        <option value="family">Family</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bed Type
                      </label>
                      <select
                        value={form.bedType}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bedType: e.target.value as any }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="queen">Queen</option>
                        <option value="king">King</option>
                        <option value="twin">Twin</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity (Guests)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.capacity}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, capacity: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size (m²)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.size}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, size: e.target.value }))
                        }
                        placeholder="e.g., 25"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pet-friendly"
                      checked={form.petFriendly}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, petFriendly: e.target.checked }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pet-friendly" className="ml-2 block text-sm text-gray-700">
                      Pet Friendly
                    </label>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Images & Media</h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Images (Max 5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        setImageFiles(e.target.files);
                        // Initialize descriptions for new files
                        if (e.target.files) {
                          const newDescriptions = Array.from(e.target.files).map(() => '');
                          setImageDescriptions(prev => [...prev, ...newDescriptions]);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload images or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>
                </div>

                {/* Image descriptions */}
                {imageFiles && imageFiles.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Image Descriptions
                    </label>
                    {Array.from(imageFiles).map((file, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 flex-1 truncate">
                            {file.name}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Add a description for this image..."
                          value={imageDescriptions[index] || ''}
                          onChange={(e) => updateImageDescription(index, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Criteria Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-lg font-semibold text-gray-900">Room Features & Criteria</h4>
                  <button
                    type="button"
                    onClick={addCriteria}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Criteria
                  </button>
                </div>
                
                {form.criteria.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">No criteria added yet</p>
                    <p className="text-xs text-gray-500">Add features like room size, facilities, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.criteria.map((criteria, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              placeholder="Criteria name (e.g., Room Size, Facilities, View)"
                              value={criteria.name}
                              onChange={(e) => updateCriteria(index, 'name', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <textarea
                              placeholder="Describe this feature in detail (e.g., Spacious 25m² room with panoramic city view and modern amenities)"
                              value={criteria.description}
                              onChange={(e) => updateCriteria(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCriteria(index)}
                            className="mt-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
