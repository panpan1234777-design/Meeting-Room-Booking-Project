"use client";

import {
  Building2,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Eye,
  Wrench,
} from "lucide-react";
import type { Room } from "@/types/room";

interface RoomCardProps {
  room: Room;
  isAdmin?: boolean;
  onDetail: (room: Room) => void;
  onEdit?: (room: Room) => void;
  onDelete?: (id: number) => void;
}

const BASE_URL = "http://localhost:8000";

export default function RoomCard({
  room,
  isAdmin = false,
  onDetail,
  onEdit,
  onDelete,
}: RoomCardProps) {
  const imageUrl = room.image
    ? room.image.startsWith("http")
      ? room.image
      : `${BASE_URL}/storage/${room.image}`
    : null;

  const isMaintenance = room.status === "maintenance";

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-indigo-950/30">

      {/* IMAGE */}
      <div className="relative h-52 overflow-hidden bg-slate-800">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={room.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
            <Building2 className="mb-2 h-12 w-12" />
            <span className="text-sm">No room image</span>
          </div>
        )}

        {/* STATUS */}
        <div
          className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
            isMaintenance
              ? "border border-amber-400/20 bg-amber-500/15 text-amber-400"
              : "border border-emerald-400/20 bg-emerald-500/15 text-emerald-400"
          }`}
        >
          {isMaintenance && <Wrench className="h-3.5 w-3.5" />}

          {isMaintenance ? "Maintenance" : "Available"}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">

        {/* TITLE */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white">
            {room.name}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
            {room.description || "No description provided for this room."}
          </p>
        </div>

        {/* ROOM INFO */}
        <div className="mb-5 grid grid-cols-2 gap-3">

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-4 w-4 text-indigo-400" />
              Location
            </div>

            <p className="text-sm font-medium text-slate-200">
              {room.location}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-4 w-4 text-indigo-400" />
              Capacity
            </div>

            <p className="text-sm font-medium text-slate-200">
              {room.capacity} Pax
            </p>
          </div>

        </div>

        {/* BUTTONS */}
        <div
          className={`grid gap-2 ${
            isAdmin ? "grid-cols-3" : "grid-cols-1"
          }`}
        >

          <button
            onClick={() => onDetail(room)}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            Details
          </button>

          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(room)}
              className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-500/20"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}

          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(room.id)}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}

        </div>
      </div>
    </div>
  );
}