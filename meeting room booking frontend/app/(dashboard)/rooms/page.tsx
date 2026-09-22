"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import RoomCard from "@/components/RoomCard";
import type { Room } from "@/types/room";

const BASE_URL = "http://localhost:8000";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] =
    useState<Room | null>(null);

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
  // DETAIL
  // --------------------------------------------------

  const handleOpenDetail = (room: Room) => {
    setSelectedRoom(room);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);

    setTimeout(() => {
      setSelectedRoom(null);
    }, 200);
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
        <div className="mb-8">

          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Meeting Rooms
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Browse available meeting rooms in our company.
          </p>

        </div>

        {/* EMPTY STATE */}
        {rooms.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                <ImageIcon className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="font-semibold text-white">
                No meeting rooms available
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no meeting rooms to display.
              </p>

            </div>

          </div>
        ) : (

          /* ROOM GRID */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onDetail={handleOpenDetail}
              />
            ))}

          </div>
        )}

      </div>

      {/* ==================================================
          DETAIL MODAL
      ================================================== */}

      {isDetailOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedRoom.name}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Meeting room information
                </p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

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

              {/* ROOM INFO */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">

                {/* NAME */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Room Name
                  </p>

                  <p className="mt-1.5 font-semibold text-white">
                    {selectedRoom.name}
                  </p>

                </div>

                {/* CAPACITY */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Capacity
                  </p>

                  <p className="mt-1.5 font-semibold text-white">
                    {selectedRoom.capacity} Pax
                  </p>

                </div>

                {/* LOCATION */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5 sm:p-4">

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Location
                  </p>

                  <p className="mt-1.5 font-semibold text-white">
                    {selectedRoom.location}
                  </p>

                </div>

                {/* STATUS */}
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

              {/* MAINTENANCE NOTICE */}
              {selectedRoom.status === "maintenance" && (
                <div className="mt-3.5 sm:mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 sm:p-4">

                  <p className="text-sm font-semibold text-amber-400">
                    This room is currently under maintenance.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-400/70">
                    Booking is temporarily unavailable until the room
                    becomes available again.
                  </p>

                </div>
              )}

              {/* CLOSE */}
              <div className="mt-5 flex justify-end">

                <button
                  onClick={handleCloseDetail}
                  className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}