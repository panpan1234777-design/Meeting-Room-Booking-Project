import { Building2, CalendarPlus } from "lucide-react";

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: string;
  today_slots?: string[];
}

interface BookingRoomCardProps {
  room: Room;
  onBookClick: (room: Room) => void;
}

export default function BookingRoomCard({ room, onBookClick }: BookingRoomCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between h-[420px] hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative group">

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/10 mb-2 inline-block">
            Ready to Schedule
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
            {room.name}
          </h3>
        </div>

        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
          {room.status}
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex-1 my-4 flex flex-col justify-start overflow-hidden">
        <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Available Today:
        </p>

        {room.today_slots && room.today_slots.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5 overflow-y-auto h-[160px] content-start pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {room.today_slots.map((slot, idx) => (
              <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium px-2 h-9 flex items-center justify-center rounded-xl text-center">
                {slot}
              </span>
            ))}
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center">
            <p className="text-xs text-slate-600 italic">No slots available today.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onBookClick(room)}
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
      >
        <CalendarPlus className="w-4 h-4" />
        Book Room
      </button>
    </div>
  );
}