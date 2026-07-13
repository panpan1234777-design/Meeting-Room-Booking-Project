"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, X, Loader2 } from "lucide-react";
import BookingRoomCard from "@/components/BookingRoomCard";

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: string;
  today_slots?: string[];
}

export default function BookingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);

  // Time Slots 
  const [availableTimePoints, setAvailableTimePoints] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const BASE_URL = "http://localhost:8000";

  const parseSlotsToPoints = (slots: any[]) => {
    const pointsSet = new Set<string>();
    slots.forEach((slot: any) => {
      let startHour = parseInt(slot.start.split(":")[0]);
      const endHour = parseInt(slot.end.split(":")[0]);
      while (startHour <= endHour) {
        if (startHour <= 17) {
          pointsSet.add(`${startHour.toString().padStart(2, "0")}:00`);
        }
        startHour++;
      }
    });
    return Array.from(pointsSet).sort();
  };

  useEffect(() => {
    const fetchRoomsAndTodaySlots = async () => {
      try {
        const token = localStorage.getItem("token");
        const todayStr = new Date().toISOString().split("T")[0];

        // 🔲 Rooms အရင်ယူမယ်
        const roomsRes = await fetch(`${BASE_URL}/api/rooms`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        const roomsData = await roomsRes.json();

        if (roomsData.status) {
          const fetchedRooms: Room[] = roomsData.data;

          const updatedRooms = await Promise.all(
            fetchedRooms.map(async (room) => {
              try {
                const slotsRes = await fetch(`${BASE_URL}/api/rooms/${room.id}/available-slots?date=${todayStr}`, {
                  headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
                });
                const slotsData = await slotsRes.json();

                if (slotsData.status) {
                  const formattedTodaySlots: string[] = [];
                  slotsData.available_slots.forEach((s: any) => {
                    let sh = parseInt(s.start.split(":")[0]);
                    const eh = parseInt(s.end.split(":")[0]);
                    while (sh < eh) {
                      if (sh < 17) {
                        formattedTodaySlots.push(`${sh.toString().padStart(2, "0")}:00-${(sh + 1).toString().padStart(2, "0")}:00`);
                      }
                      sh++;
                    }
                  });
                  return { ...room, today_slots: formattedTodaySlots };
                }
              } catch (e) {
                console.error("Error sub-fetching slots", e);
              }
              return { ...room, today_slots: [] };
            })
          );
          setRooms(updatedRooms);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoomsAndTodaySlots();
  }, []);

  useEffect(() => {
    if (!selectedRoom || !bookingDate) return;

    const fetchModalSlots = async () => {
      try {
        setIsLoadingSlots(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/rooms/${selectedRoom.id}/available-slots?date=${bookingDate}`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        const resData = await response.json();

        if (resData.status) {
          const points = parseSlotsToPoints(resData.available_slots);
          setAvailableTimePoints(points);

          if (points.length > 1) {
            setStartTime(points[0]);
            setEndTime(points[1]);
          } else {
            setStartTime("");
            setEndTime("");
          }
        }
      } catch (error) {
        console.error("Error fetching modal slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchModalSlots();
  }, [selectedRoom, bookingDate]);

  useEffect(() => {
    if (!startTime || availableTimePoints.length === 0) return;

    let validEndOptions: string[] = [];

    if (startTime) {
      const [hour, minute] = startTime.split(':').map(Number);
      const nextHour = String(hour + 1).padStart(2, '0');
      const nextTime = `${nextHour}:${String(minute).padStart(2, '0')}`; 

      validEndOptions = [nextTime];
    }
    if (!validEndOptions.includes(endTime)) {
      setEndTime(validEndOptions[0] || "");
    }
  }, [startTime, availableTimePoints]);

  const handleOpenBookForm = (room: Room) => {
    setSelectedRoom(room);
    setPurpose("");
    setIsFormOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !startTime || !endTime) return;

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      alert("End time must be after start time!");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          purpose: purpose
        })
      });

      if (response.ok) {
        setIsFormOpen(false);
        router.push("/my-bookings");
      } else {
        const resData = await response.json();
        alert(`Failed to book: ${resData.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Booking Submit Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading rooms and schedules...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Book a Meeting Room</h1>
        <p className="text-slate-400 text-sm mt-1">Select a room below to schedule your meeting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <BookingRoomCard
            key={room.id}
            room={room}
            onBookClick={handleOpenBookForm}
          />
        ))}
      </div>

      {/* 📅 MODAL FORM WITH START TIME AND END TIME SELECT BOXES */}
      {isFormOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">

            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-indigo-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Book {selectedRoom.name}
            </h2>

            <form onSubmit={handleSubmitBooking} className="space-y-4 text-sm">

              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 scheme-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                  {availableTimePoints.length > 0 ? (
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {availableTimePoints.slice(0, -1).map((pt, idx) => (
                        <option key={idx} value={pt}>{pt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center text-slate-500">No time</div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Time</label>
                  {availableTimePoints.length > 0 ? (
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {availableTimePoints.filter(pt => pt > startTime).map((pt, idx) => (
                        <option key={idx} value={pt}>{pt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center text-slate-500">No time</div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Meeting Purpose</label>
                <textarea
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white h-20 resize-none focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Project Discussion..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" disabled={availableTimePoints.length === 0 || isLoadingSlots} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-2.5 rounded-xl font-semibold transition">Confirm Book</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}