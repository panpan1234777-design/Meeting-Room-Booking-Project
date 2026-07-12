"use client";
import { useState, useEffect } from "react";
import { Building2, X, Loader2, Info } from "lucide-react";
import RoomCard from "@/components/RoomCard"; 

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: string;
}

export default function UserRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Detail Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const BASE_URL = "http://localhost:8000"; 

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/rooms`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        const resData = await response.json();
        if (resData.status) {
          setRooms(resData.data);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleOpenDetail = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Meeting Rooms</h1>
        <p className="text-slate-400 text-sm mt-1">Browse available meeting rooms in our company.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard 
            key={room.id}
            room={room}
            onDetail={handleOpenDetail}
            onEdit={() => {}}   
            onDelete={() => {}} 
          />
        ))}
      </div>

      {isModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>

            <h2 className="text-xl font-bold mb-4 text-indigo-400 flex items-center gap-2">
              <Info className="w-5 h-5" /> Room Specification
            </h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <Building2 className="w-12 h-12 text-indigo-400 mb-2" />
                <span className="text-lg font-bold text-white">{selectedRoom.name}</span>
              </div>
              
              <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
                <p className="flex justify-between"><span className="text-slate-400">Location:</span><span>{selectedRoom.location}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Capacity:</span><span>{selectedRoom.capacity} Pax</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Status:</span><span className={selectedRoom.status === 'available' ? 'text-emerald-400' : 'text-amber-500'}>{selectedRoom.status}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}