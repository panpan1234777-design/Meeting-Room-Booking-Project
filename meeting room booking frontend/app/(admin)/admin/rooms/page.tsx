"use client";
import { useState, useEffect } from "react";
import { Plus, Loader2, X, Building2 } from "lucide-react";
import RoomCard from "@/components/RoomCard"; 

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "detail">("create");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form Input States
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("available");

  const BASE_URL = "http://localhost:8000"; 

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
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

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedRoom(null);
    setName(""); setCapacity(""); setLocation(""); setStatus("available");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setModalMode("edit");
    setSelectedRoom(room);
    setName(room.name);
    setCapacity(room.capacity.toString());
    setLocation(room.location);
    setStatus(room.status);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (room: Room) => {
    setModalMode("detail");
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = { name, capacity: parseInt(capacity), location, status };
    const url = modalMode === "create" ? `${BASE_URL}/api/rooms` : `${BASE_URL}/api/rooms/${selectedRoom?.id}`;
    const method = modalMode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`Room successfully ${modalMode === "create" ? "created" : "updated"}!`);
        setIsModalOpen(false);
        fetchRooms();
      } else {
        const errData = await response.json();
        alert(errData.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error saving room:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${BASE_URL}/api/rooms/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Room deleted successfully!");
        setRooms(rooms.filter(room => room.id !== id));
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manage Meeting Rooms (Admin)</h1>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard 
            key={room.id}
            room={room}
            onDetail={handleOpenDetail}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-4 text-indigo-400 capitalize">{modalMode} Room</h2>

            {modalMode === "detail" && selectedRoom ? (
              <div className="space-y-4 text-slate-300">
                <p><strong>Name:</strong> {selectedRoom.name}</p>
                <p><strong>Location:</strong> {selectedRoom.location}</p>
                <p><strong>Capacity:</strong> {selectedRoom.capacity} Pax</p>
                <p><strong>Status:</strong> {selectedRoom.status}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm text-black">
                <input type="text" placeholder="Room Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5"/>
                <input type="number" placeholder="Capacity" required value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5"/>
                <input type="text" placeholder="Location" required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5"/>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5">
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold capitalize">{modalMode}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}