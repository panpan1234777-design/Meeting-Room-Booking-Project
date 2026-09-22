"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import RoomCard from "@/components/RoomCard";
import type { Room } from "@/types/room";

type ModalMode = "create" | "edit" | "detail";

const BASE_URL = "http://localhost:8000";

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] =
    useState<"available" | "maintenance">("available");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // Preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------
  // IMAGE URL
  // --------------------------------------------------

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    return `${BASE_URL}/storage/${imagePath}`;
  };

  // --------------------------------------------------
  // FETCH ROOMS
  // --------------------------------------------------

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/rooms`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setRooms(data.data);
      } else {
        console.error("Failed to fetch rooms:", data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setName("");
    setCapacity("");
    setLocation("");
    setStatus("available");
    setDescription("");
    setImage(null);
    setImagePreview(null);
    setSelectedRoom(null);
  };

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  const handleOpenCreate = () => {
    resetForm();

    setModalMode("create");
    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const handleOpenEdit = (room: Room) => {
    setModalMode("edit");
    setSelectedRoom(room);

    setName(room.name);
    setCapacity(room.capacity.toString());
    setLocation(room.location);
    setStatus(room.status);
    setDescription(room.description || "");

    setImage(null);

    const oldImage = getImageUrl(room.image);
    setImagePreview(oldImage);

    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // DETAIL
  // --------------------------------------------------

  const handleOpenDetail = (room: Room) => {
    setModalMode("detail");
    setSelectedRoom(room);

    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const handleCloseModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);

    setTimeout(() => {
      resetForm();
      setModalMode("create");
    }, 200);
  };

  // --------------------------------------------------
  // IMAGE SELECT
  // --------------------------------------------------

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // --------------------------------------------------
  // CREATE / EDIT
  // --------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter room name.");
      return;
    }

    if (!capacity || Number(capacity) < 1) {
      alert("Please enter a valid capacity.");
      return;
    }

    if (!location.trim()) {
      alert("Please enter room location.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Authentication token not found.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("capacity", capacity);
      formData.append("location", location.trim());
      formData.append("status", status);
      formData.append("description", description.trim());

      // Image
      if (image) {
        formData.append("image", image);
      }

      // Laravel method spoofing for update
      if (modalMode === "edit") {
        formData.append("_method", "PUT");
      }

      const url =
        modalMode === "create"
          ? `${BASE_URL}/api/rooms`
          : `${BASE_URL}/api/rooms/${selectedRoom?.id}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          modalMode === "create"
            ? "Room created successfully!"
            : "Room updated successfully!"
        );

        handleCloseModal();

        await fetchRooms();
      } else {
        console.error("Room save error:", data);

        if (data.errors) {
          const firstError = Object.values(data.errors)
            .flat()
            .join("\n");

          alert(firstError);
        } else {
          alert(data.message || "Something went wrong.");
        }
      }
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Unable to save room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this room?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Authentication token not found.");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/rooms/${id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRooms((currentRooms) =>
          currentRooms.filter((room) => room.id !== id)
        );

        alert("Room deleted successfully!");
      } else {
        alert(data.message || "Unable to delete room.");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Unable to delete room.");
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />

          <p className="text-sm text-slate-400">
            Loading meeting rooms...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Manage Meeting Rooms
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Create, manage and maintain your meeting rooms.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add New Room
          </button>

        </div>

        {/* ROOM GRID */}
        {rooms.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                <ImageIcon className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="font-semibold text-white">
                No meeting rooms
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first meeting room to get started.
              </p>

              <button
                onClick={handleOpenCreate}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Add New Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isAdmin
                onDetail={handleOpenDetail}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>

      {/* ==================================================
          MODAL
      ================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-white">
                  {modalMode === "create"
                    ? "Add New Meeting Room"
                    : modalMode === "edit"
                    ? "Edit Meeting Room"
                    : "Meeting Room Details"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "detail"
                    ? "View room information"
                    : "Manage room information and availability"}
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* ==================================================
                DETAIL
            ================================================== */}

            {modalMode === "detail" && selectedRoom && (
              <div className="p-5 sm:p-6">

                {/* IMAGE */}
                <div className="mb-4 overflow-hidden rounded-2xl bg-slate-800">

                  {getImageUrl(selectedRoom.image) ? (
                    <img
                      src={getImageUrl(selectedRoom.image)!}
                      alt={selectedRoom.name}
                      className="h-48 sm:h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 sm:h-56 flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="mb-3 h-12 w-12" />
                      <p className="text-sm">
                        No room image
                      </p>
                    </div>
                  )}

                </div>

                {/* INFO */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">

                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Room Name
                    </p>

                    <p className="mt-1.5 font-semibold text-white">
                      {selectedRoom.name}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Capacity
                    </p>

                    <p className="mt-1.5 font-semibold text-white">
                      {selectedRoom.capacity} Pax
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Location
                    </p>

                    <p className="mt-1.5 font-semibold text-white">
                      {selectedRoom.location}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Status
                    </p>

                    <p
                      className={`mt-1.5 font-semibold ${
                        selectedRoom.status === "available"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {selectedRoom.status === "available"
                        ? "Available"
                        : "Maintenance"}
                    </p>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <div className="mt-3.5 sm:mt-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Description
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-slate-300">
                    {selectedRoom.description ||
                      "No description provided for this room."}
                  </p>
                </div>

              </div>
            )}

            {/* ==================================================
                CREATE / EDIT FORM
            ================================================== */}

            {(modalMode === "create" ||
              modalMode === "edit") && (
              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-6"
              >

                {/* IMAGE */}
                <div className="mb-4">

                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Room Image
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50">

                    {imagePreview ? (
                      <div className="relative">

                        <img
                          src={imagePreview}
                          alt="Room preview"
                          className="h-40 sm:h-48 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute right-3 top-3 rounded-xl bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
                        >
                          <X className="h-4 w-4" />
                        </button>

                      </div>
                    ) : (
                      <label className="flex h-40 sm:h-48 cursor-pointer flex-col items-center justify-center">

                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700">
                          <Upload className="h-5 w-5 text-indigo-400" />
                        </div>

                        <p className="text-sm font-medium text-slate-300">
                          Upload room image
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          PNG, JPG or WEBP
                        </p>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />

                      </label>
                    )}

                    {imagePreview && (
                      <div className="border-t border-slate-700 p-2.5">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700">
                          <Upload className="h-3.5 w-3.5" />
                          Change Image

                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                  </div>

                </div>

                {/* FORM GRID */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* NAME */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Room Name
                    </label>

                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="e.g. Mind Room"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* CAPACITY */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Capacity
                    </label>

                    <input
                      type="number"
                      min="1"
                      required
                      value={capacity}
                      onChange={(e) =>
                        setCapacity(e.target.value)
                      }
                      placeholder="e.g. 10"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* LOCATION */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Location
                    </label>

                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      placeholder="e.g. 4th Floor"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* STATUS */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Room Status
                    </label>

                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as
                            | "available"
                            | "maintenance"
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="available">
                        Available
                      </option>

                      <option value="maintenance">
                        Maintenance
                      </option>
                    </select>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <div className="mt-4">

                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Describe this meeting room..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />

                </div>

                {/* ACTIONS */}
                <div className="mt-5 flex justify-end gap-3 border-t border-slate-800 pt-4">

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {modalMode === "create"
                      ? "Create Room"
                      : "Save Changes"}
                  </button>

                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}