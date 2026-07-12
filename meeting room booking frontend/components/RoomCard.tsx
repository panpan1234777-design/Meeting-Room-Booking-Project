import { Building2, Users, MapPin, Info, Edit3, Trash2 } from "lucide-react";

interface Room {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  location: string;
  status: string;
}
interface RoomCardProps {
  room: any;
  onDetail: (room: any) => void;
  onEdit: (room: any) => void;
  onDelete: (id: number) => void;
}
export default function RoomCard({ room, onDetail, onEdit, onDelete }: RoomCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between h-full hover:border-slate-700 transition-all duration-300">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white tracking-wide">{room.name}</h3>
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${room.status === "available"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
            {room.status}
          </span>
        </div>
        <div className="w-full h-44 bg-slate-800/40 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center gap-2 mb-4 text-slate-500 group">
          <Building2 className="w-12 h-12 text-indigo-400/80 group-hover:scale-110 transform duration-300" />
          <span className="text-xs text-slate-400 font-medium">Meeting Room Image Placeholder</span>
        </div>
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-winder">Description</span>
          <p className="text-slate-300 text-sm mt-1 line-clamp-3">
            {room.description || "No description provided for this meeting room."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/30 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
            <span className="text-xs text-white font-medium line-clamp-1">{room.location}</span>
          </div>
          <div className="bg-slate-800/30 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
            <span className="text-xs text-white font-medium">{room.capacity} Pax</span>
          </div>
        </div>
      </div>
      <div className={`grid gap-2 pt-2 border-t border-slate-800/60 ${typeof window !== 'undefined' && localStorage.getItem("role") === "admin"
          ? "grid-cols-3"
          : "grid-cols-1"
        }`}>

        <button
          onClick={() => onDetail(room)}
          className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-xl text-xs font-semibold"
        >
          Detail
        </button>

        {typeof window !== 'undefined' && localStorage.getItem("role") === "admin" && (
          <>
            <button
              onClick={() => onEdit(room)}
              className="flex items-center justify-center gap-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 py-1.5 rounded-xl text-xs font-semibold"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(room.id)}
              className="flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-1.5 rounded-xl text-xs font-semibold"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}