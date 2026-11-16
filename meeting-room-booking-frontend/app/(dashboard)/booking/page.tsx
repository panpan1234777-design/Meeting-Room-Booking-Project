"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";


interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: string;
  today_slots?: string[];
  modal_slots?: string[];
}

export default function BookingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
  const [bookingDate, setBookingDate] = useState(todayStr);

  const [successMessage, setSuccessMessage] = useState("");

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(todayObj.getMonth());
  const [calendarYear, setCalendarYear] = useState(todayObj.getFullYear());

  // Clock picker state
  const [activeTimeField, setActiveTimeField] = useState<"start" | "end">(
    "start",
  );
  const [pickerMode, setPickerMode] = useState<"hour" | "minute">("hour");
  const [tempHour24, setTempHour24] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  const calendarDropdownRef = useRef<HTMLDivElement>(null);
  const BASE_URL = "http://localhost:8000";

  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 17;

  const timeStrToMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return false;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

   // Filter out past slots for TODAY only; empty on weekends
  const getFilteredAvailableSlots = (slots?: string[], dateStr?: string) => {
    if (!slots || slots.length === 0) return [];
    const targetDate = dateStr || bookingDate;
    if (isWeekend(targetDate)) return [];

    if (targetDate === todayStr) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const earliestStart = Math.floor(currentMins / 5) * 5 + 5;
      const fmt = (m: number) =>
        `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

      const result: string[] = [];
      slots.forEach((slot) => {
        const parts = slot.split(" - ");
        if (parts.length !== 2) {
          result.push(slot);
          return;
        }
        const slotStart = timeStrToMins(parts[0]);
        const slotEnd = timeStrToMins(parts[1]);
        const newStart = Math.max(slotStart, earliestStart);
        if (newStart >= slotEnd) return;
        result.push(`${fmt(newStart)} - ${fmt(slotEnd)}`);
      });
      return result;
    }
    return slots;
  };

  // Free (non-booked) windows for a date, in minutes-from-midnight
  const getAvailableRanges = (dateStr: string) => {
    const filtered = getFilteredAvailableSlots(
      selectedRoom?.modal_slots,
      dateStr,
    );
    return filtered
      .map((slot) => {
        const parts = slot.split(" - ");
        if (parts.length !== 2) return null;
        return { start: timeStrToMins(parts[0]), end: timeStrToMins(parts[1]) };
      })
      .filter((r): r is { start: number; end: number } => r !== null);
  };
  //Rooms
  useEffect(() => {
    const fetchRoomsAndTodaySlots = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/api/rooms`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const roomsData = await response.json();

        if (roomsData.status) {
          const fetchedRooms: Room[] = roomsData.data;
          const updatedRooms = await Promise.all(
            fetchedRooms.map(async (room) => {
              try {
                const slotRes = await fetch(
                  `${BASE_URL}/api/rooms/${room.id}/available-slots?date=${todayStr}`,
                  {
                    headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                const slotData = await slotRes.json();
                if (slotData.status && slotData.available_slots) {
                  const formattedSlots = slotData.available_slots.map(
                    (slot: any) => {
                      if (typeof slot === "object" && slot !== null) {
                        return `${slot.start} - ${slot.end}`;
                      }
                      return String(slot);
                    },
                  );
                  return { ...room, today_slots: formattedSlots };
                }
                return { ...room, today_slots: [] };
              } catch (e) {
                return { ...room, today_slots: [] };
              }
            }),
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
  }, [todayStr]);

  useEffect(() => {
    const fetchModalSlots = async () => {
      if (!selectedRoom) return;
      try {
        const token = localStorage.getItem("token");
        const slotRes = await fetch(
          `${BASE_URL}/api/rooms/${selectedRoom.id}/available-slots?date=${bookingDate}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const slotData = await slotRes.json();
        if (slotData.status && slotData.available_slots) {
          const formattedSlots = slotData.available_slots.map((slot: any) => {
            if (typeof slot === "object" && slot !== null) {
              return `${slot.start} - ${slot.end}`;
            }
            return String(slot);
          });
          setSelectedRoom((prev) =>
            prev ? { ...prev, modal_slots: formattedSlots } : null,
          );
        } else {
          setSelectedRoom((prev) =>
            prev ? { ...prev, modal_slots: [] } : null,
          );
        }
      } catch (e) {
        setSelectedRoom((prev) => (prev ? { ...prev, modal_slots: [] } : null));
      }
    };

    if (isFormOpen && selectedRoom) {
      fetchModalSlots();
    }
  }, [bookingDate, isFormOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitialValidTime = () => {
    const now = new Date();
    let startH = WORK_START_HOUR;
    let startM = 0;

    if (bookingDate === todayStr) {
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      if (currentH >= WORK_END_HOUR) {
        startH = WORK_START_HOUR;
      } else if (currentH >= WORK_START_HOUR) {
        startH = currentM >= 30 ? currentH + 1 : currentH;
        startM = currentM >= 30 ? 0 : 30;
        if (startH >= WORK_END_HOUR) startH = WORK_START_HOUR;
      }
    }

    const endH = Math.min(startH + 1, WORK_END_HOUR);
    const startStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
    const endStr = `${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
    return { startStr, endStr, startH, startM };
  };

  const handleOpenBookForm = (room: Room) => {
    setSelectedRoom(room);
    setBookingDate(todayStr);
    setCalendarMonth(todayObj.getMonth());
    setCalendarYear(todayObj.getFullYear());
    setPurpose("");
    setErrorMessage("");
    setActiveTimeField("start");
    setIsCalendarOpen(false);

    const filteredTodaySlots = getFilteredAvailableSlots(
      room.today_slots,
      todayStr,
    );
    if (filteredTodaySlots.length > 0) {
      const parts = filteredTodaySlots[0].split(" - ");
      if (parts.length === 2) {
        setStartTime(parts[0].slice(0, 5));
        setEndTime(parts[1].slice(0, 5));
        const [h, m] = parts[0].split(":").map(Number);
        setTempHour24(h);
        setTempMinute(m);
      } else {
        const { startStr, endStr, startH, startM } = getInitialValidTime();
        setStartTime(startStr);
        setEndTime(endStr);
        setTempHour24(startH);
        setTempMinute(startM);
      }
    } else {
      const { startStr, endStr, startH, startM } = getInitialValidTime();
      setStartTime(startStr);
      setEndTime(endStr);
      setTempHour24(startH);
      setTempMinute(startM);
    }

    setIsFormOpen(true);
  };

  const handleSelectSlotBadge = (slotStr: string) => {
    const parts = slotStr.split(" - ");
    if (parts.length === 2) {
      const s = parts[0].slice(0, 5);
      const e = parts[1].slice(0, 5);
      setStartTime(s);
      setEndTime(e);
      setErrorMessage("");
      const [h, m] = s.split(":").map(Number);
      setTempHour24(isNaN(h) ? 9 : h);
      setTempMinute(isNaN(m) ? 0 : m);
    }
  };

  const handleSelectTimeField = (field: "start" | "end") => {
    setActiveTimeField(field);
    const val = field === "start" ? startTime : endTime;
    if (val) {
      const [h, m] = val.split(":").map(Number);
      setTempHour24(isNaN(h) ? 9 : h);
      setTempMinute(isNaN(m) ? 0 : m);
    }
    setPickerMode("hour");
  };

  const updateSelectedTime = (h24: number, min: number) => {
    const formatted = `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    if (activeTimeField === "start") {
      setStartTime(formatted);
      const startMinsNow = h24 * 60 + min;
      const ranges = getAvailableRanges(bookingDate);
      const range = ranges.find(
        (r) => startMinsNow >= r.start && startMinsNow < r.end,
      );
      const cap = range ? range.end : WORK_END_HOUR * 60;
      const desiredEnd = Math.min(startMinsNow + 60, cap, WORK_END_HOUR * 60);
      const endH = Math.floor(desiredEnd / 60);
      const endM = desiredEnd % 60;
      setEndTime(
        `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
      );
    } else {
      setEndTime(formatted);
    }
    setErrorMessage("");
  };

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "-- : -- --";
    const [h24, m] = time24.split(":").map(Number);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    h12 = h12 === 0 ? 12 : h12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  };

    const handleSubmitBooking = async (e?: React.FormEvent) => {
    e?.preventDefault();

  if (!selectedRoom) {
    setErrorMessage("Please select a meeting room.");
    return;
  }

  if (!startTime || !endTime) {
    setErrorMessage("Please select start time and end time.");
    return;
  }

 //1.weekend validation
  if (isWeekend(bookingDate)) {
    setErrorMessage(
      "Booking is not available on weekends. Please select a weekday."
    );
    return;
  }

 //2.convert time to minute
  const startMins = timeStrToMins(startTime);
  const endMins = timeStrToMins(endTime);

  //3.working hour validation
  const WORK_START = 9 * 60;
  const WORK_END = 17 * 60;

  if (startMins < WORK_START || startMins >= WORK_END) {
    setErrorMessage(
      "Bookings are only allowed during office hours (9:00 AM – 5:00 PM)."
    );
    return;
  }

  if (endMins <= WORK_START || endMins > WORK_END) {
    setErrorMessage(
      "Bookings are only allowed during office hours (9:00 AM – 5:00 PM)."
    );
    return;
  }

//4. Start must be before end
  if (startMins >= endMins) {
    setErrorMessage(
      "End time must be later than start time."
    );
    return;
  }

 // 5. Same-day past time validation
  if (bookingDate === todayStr) {
    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    if (startMins <= currentMinutes) {
      setErrorMessage(
        "This time has already passed. Please select a later time."
      );
      return;
    }
  }

  // --------------------------------------------------
  // 6. Purpose validation
  // --------------------------------------------------
  if (!purpose.trim()) {
    setErrorMessage(
      "Please enter the purpose of the meeting."
    );
    return;
  }

  // --------------------------------------------------
  // Continue with API request...
  // --------------------------------------------------

    // --------------------------------------------------
    // 7. Send booking request to backend
    // --------------------------------------------------
    try {
  setIsSubmitting(true);

  const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          purpose: purpose.trim(),
        }),
      });

      const data = await response.json();

      // --------------------------------------------------
      // 8. Existing booking / backend validation
      // --------------------------------------------------
   if (!response.ok) {
  if (data.errors) {
    const firstError = Object.values(data.errors)
      .flat()
      .find((message) => typeof message === "string");

    setErrorMessage(
      firstError || "This room already has an existing booking."
    );

    return;
  }

  setErrorMessage(
    data.message || "This room already has an existing booking."
  );

  return;
}

// --------------------------------------------------
// Booking success
// --------------------------------------------------
setSuccessMessage("Booking created successfully!");

setIsFormOpen(false);
setSelectedRoom(null);
setPurpose("");
setErrorMessage("");

// Redirect immediately
router.push("/my-bookings");

    } catch (error) {
      console.error("Booking error:", error);

     setErrorMessage(
    "Something went wrong while creating the booking."
  );
    } finally {
  setIsSubmitting(false);
}
  };
//Calendar(the whole week)
  const isDateWithinAllowedRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date(todayStr);
    const maxDate = new Date(todayStr);
    maxDate.setDate(t.getDate() + 6);

    d.setHours(0, 0, 0, 0);
    t.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    return d >= t && d <= maxDate;
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // ---- Clock dial derived state ----
  const clockHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const current12Hour = tempHour24 % 12 === 0 ? 12 : tempHour24 % 12;
  const isPM = tempHour24 >= 12;

  const modalRanges = selectedRoom ? getAvailableRanges(bookingDate) : [];
  const startMinsValue = startTime ? timeStrToMins(startTime) : 0;
  const startRange = modalRanges.find(
    (r) => startMinsValue >= r.start && startMinsValue < r.end,
  );

  const isHourDisabled = () => {
    return false;
  };

  const isMinuteDisabled = () => {
    return false;
  };

  const isAmDisabled = () => {
    if (isWeekend(bookingDate)) return true;
    if (bookingDate === todayStr && new Date().getHours() >= 12) return true;
    return false;
  };
  const isPmDisabled = () => {
    if (isWeekend(bookingDate)) return true;
    if (bookingDate === todayStr && new Date().getHours() >= 17) return true;
    return false;
  };

  let handAngle = 0;
  if (pickerMode === "hour") {
    handAngle = (current12Hour % 12) * 30;
  } else {
    handAngle = (tempMinute / 60) * 360;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading rooms and schedules...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          Book a Meeting Room
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select a room below to schedule your meeting during office hours (9:00
          AM – 5:00 PM, Mon–Fri)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const isMaintenance = room.status === "maintenance";
          const filteredTodaySlots = getFilteredAvailableSlots(
            room.today_slots,
            todayStr,
          );
          const todayIsWeekend = isWeekend(todayStr);

          return (
            <div
              key={room.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] px-2.5 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded-full font-medium tracking-wide">
                    MEETING ROOM
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isMaintenance
                        ? "text-amber-400 bg-amber-950/50 border-amber-800/40"
                        : "text-emerald-400 bg-emerald-950/50 border-emerald-800/40"
                    }`}
                  >
                    {isMaintenance ? "Maintenance" : "Available"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {room.name}
                </h3>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 mb-4">
                  <div className="text-xs text-slate-400 font-medium mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{" "}
                      Available Today:
                    </span>
                    {todayIsWeekend && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                        Weekend
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
                    {isMaintenance ? (
                      <span className="text-xs text-amber-400/80 italic">
                        Room is under maintenance
                      </span>
                    ) : todayIsWeekend ? (
                      <span className="text-xs text-amber-400/80 italic">
                        Office closed on weekends
                      </span>
                    ) : filteredTodaySlots.length > 0 ? (
                      filteredTodaySlots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            handleOpenBookForm(room);
                            handleSelectSlotBadge(slot);
                          }}
                          className="text-xs font-mono bg-slate-900 hover:bg-indigo-600/20 hover:border-indigo-500 text-slate-300 hover:text-indigo-300 border border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          {slot}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        No slots remaining for today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isMaintenance}
                onClick={() => handleOpenBookForm(room)}
                className={`w-full font-bold py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2.5 ${
                  isMaintenance
                    ? "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 cursor-pointer"
                }`}
              >
                {isMaintenance ? (
                  "Under Maintenance"
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 text-white" /> Book Room
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {isFormOpen && selectedRoom && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Book {selectedRoom.name}
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Office Hours: 09:00 AM – 05:00 PM</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-indigo-400">
                      Mon–Fri Only
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 no-scrollbar">
              {/* Left column */}
              <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-950/50 border-r border-slate-800/80 flex flex-col gap-5">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wider text-[11px] text-indigo-400">
                    Selected Room Overview
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-white">
                      {selectedRoom.name}
                    </span>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 rounded-full font-medium">
                      Ready to Book
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-xl flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Capacity: {selectedRoom.capacity} People</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-xl flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span>{selectedRoom.location || "Main Floor"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative" ref={calendarDropdownRef}>
                  <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                    <span>1. Select Date (1 Week Advance)</span>
                    {isWeekend(bookingDate) && (
                      <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Closed Weekend
                      </span>
                    )}
                  </label>
                  <div
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className={`w-full bg-slate-950 border rounded-2xl px-4 py-3 text-white text-sm flex items-center justify-between cursor-pointer transition ${
                      isWeekend(bookingDate)
                        ? "border-amber-500/60 bg-amber-950/20"
                        : "border-slate-800 hover:border-indigo-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono font-medium">
                        {bookingDate.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <span className="text-xs text-indigo-400 underline font-medium">
                      Change Date
                    </span>
                  </div>

                  {isCalendarOpen && (
                    <div className="absolute top-16 left-0 right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">
                          {monthNames[calendarMonth]} {calendarYear}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 0) {
                                setCalendarMonth(11);
                                setCalendarYear(calendarYear - 1);
                              } else {
                                setCalendarMonth(calendarMonth - 1);
                              }
                            }}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 11) {
                                setCalendarMonth(0);
                                setCalendarYear(calendarYear + 1);
                              } else {
                                setCalendarMonth(calendarMonth + 1);
                              }
                            }}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                        {daysOfWeek.map((d, idx) => (
                          <span
                            key={d}
                            className={`text-[11px] font-semibold ${
                              idx === 0 || idx === 6
                                ? "text-amber-500 font-bold"
                                : "text-slate-500"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {Array.from({
                          length: getFirstDayOfMonth(
                            calendarYear,
                            calendarMonth,
                          ),
                        }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({
                          length: getDaysInMonth(calendarYear, calendarMonth),
                        }).map((_, i) => {
                          const dayNum = i + 1;
                          const formattedMonth = String(
                            calendarMonth + 1,
                          ).padStart(2, "0");
                          const formattedDay = String(dayNum).padStart(2, "0");
                          const dateStr = `${calendarYear}-${formattedMonth}-${formattedDay}`;
                          const isAllowed = isDateWithinAllowedRange(dateStr);
                          const isSelected = bookingDate === dateStr;
                          const dateIsWeekend = isWeekend(dateStr);

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => {
                                setBookingDate(dateStr);
                                setIsCalendarOpen(false);
                                setErrorMessage("");
                              }}
                              className={`py-2 text-xs font-medium rounded-lg transition ${
                                isSelected
                                  ? dateIsWeekend
                                    ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-600/40"
                                    : "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40"
                                  : isAllowed
                                    ? dateIsWeekend
                                      ? "text-amber-400 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/30"
                                      : "text-slate-200 hover:bg-slate-800"
                                    : "text-slate-600 cursor-not-allowed opacity-30"
                              }`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex-1 flex flex-col">
                  <span className="text-xs text-slate-300 block mb-2 font-semibold">
                    2. Available Time Slots (
                    {bookingDate.split("-").reverse().join("/")}):
                  </span>

                  {isWeekend(bookingDate) ? (
                    <div className="my-auto p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex flex-col items-center text-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                      <div>
                        <p className="font-bold text-amber-200">
                          No Available Slots
                        </p>
                        <p className="text-[11px] text-amber-400/90 mt-0.5">
                          Office is closed on weekends (Saturday & Sunday).
                          Please select a weekday.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                      {getFilteredAvailableSlots(
                        selectedRoom.modal_slots,
                        bookingDate,
                      ).length > 0 ? (
                        getFilteredAvailableSlots(
                          selectedRoom.modal_slots,
                          bookingDate,
                        ).map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectSlotBadge(slot)}
                            className="text-xs font-mono bg-slate-900 hover:bg-indigo-600/20 hover:border-indigo-500 text-slate-300 hover:text-indigo-300 border border-slate-800 px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            {slot}
                          </button>
                        ))
                      ) : (
                        <div className="my-auto p-3 text-center text-slate-500 text-xs italic w-full">
                          No available slots remaining for this date.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <form
                  onSubmit={handleSubmitBooking}
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs shadow-lg">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Start / End time cards */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div
                        onClick={() => handleSelectTimeField("start")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                          activeTimeField === "start"
                            ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Start Time
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-lg font-mono font-extrabold text-white">
                            {formatDisplayTime(startTime)}
                          </span>
                          <Clock
                            className={`w-4 h-4 ${activeTimeField === "start" ? "text-indigo-400" : "text-slate-500"}`}
                          />
                        </div>
                      </div>

                      <div
                        onClick={() => handleSelectTimeField("end")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                          activeTimeField === "end"
                            ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          End Time
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-lg font-mono font-extrabold text-white">
                            {formatDisplayTime(endTime)}
                          </span>
                          <Clock
                            className={`w-4 h-4 ${activeTimeField === "end" ? "text-indigo-400" : "text-slate-500"}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clock dial */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Select {activeTimeField === "start" ? "Start" : "End"}{" "}
                          Hour & Minute
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Allowed: 9:00 AM – 5:00 PM
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-inner">
                            <button
                              type="button"
                              onClick={() => setPickerMode("hour")}
                              className={`text-2xl font-extrabold px-4 py-1.5 rounded-xl transition ${
                                pickerMode === "hour"
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {String(current12Hour).padStart(2, "0")}
                            </button>
                            <span className="text-2xl font-bold text-slate-500">
                              :
                            </span>
                            <button
                              type="button"
                              onClick={() => setPickerMode("minute")}
                              className={`text-2xl font-extrabold px-4 py-1.5 rounded-xl transition ${
                                pickerMode === "minute"
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {String(tempMinute).padStart(2, "0")}
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isAmDisabled()}
                              onClick={() => {
                                if (isPM) {
                                  const newH = tempHour24 - 12;
                                  setTempHour24(newH);
                                  updateSelectedTime(newH, tempMinute);
                                }
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                                !isPM
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : isAmDisabled()
                                    ? "bg-slate-900 text-slate-600 border border-slate-800 opacity-20 cursor-not-allowed pointer-events-none"
                                    : "bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              disabled={isPmDisabled()}
                              onClick={() => {
                                if (!isPM) {
                                  const newH = tempHour24 + 12;
                                  setTempHour24(newH);
                                  updateSelectedTime(newH, tempMinute);
                                }
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                                isPM
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : isPmDisabled()
                                    ? "bg-slate-900 text-slate-600 border border-slate-800 opacity-20 cursor-not-allowed pointer-events-none"
                                    : "bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>

                        {/* Dial */}
                        <div className="relative w-40 h-40 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center shadow-inner">
                          <div
                            className="absolute w-0.5 bg-indigo-500 origin-bottom transition-all duration-200 z-0 pointer-events-none"
                            style={{
                              height: "48px",
                              bottom: "50%",
                              left: "calc(50% - 0.75px)",
                              transform: `rotate(${handAngle}deg)`,
                            }}
                          >
                            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-md shadow-indigo-500"></div>
                          </div>
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full absolute z-20 shadow-md"></div>

                          {pickerMode === "hour"
                            ? clockHours.map((hr, idx) => {
                                const angle = idx * 30 * (Math.PI / 180);
                                const radius = 50;
                                const x = Math.sin(angle) * radius;
                                const y = -Math.cos(angle) * radius;
                                const isSelected = current12Hour === hr;
                                const disabled = false;

                                return (
                                  <button
                                    key={hr}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      let newH = hr;
                                      if (isPM && hr !== 12) newH += 12;
                                      if (!isPM && hr === 12) newH = 0;
                                      setTempHour24(newH);
                                      updateSelectedTime(newH, tempMinute);
                                      setPickerMode("minute");
                                    }}
                                    style={{
                                      top: `calc(50% + ${y}px)`,
                                      left: `calc(50% + ${x}px)`,
                                      transform: "translate(-50%, -50%)",
                                    }}
                                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-110 cursor-pointer"
                                        : "text-slate-300 hover:bg-slate-800 cursor-pointer"
                                    }`}
                                  >
                                    {hr}
                                  </button>
                                );
                              })
                            : [
                                0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
                              ].map((min, idx) => {
                                const angle = idx * 30 * (Math.PI / 180);
                                const radius = 50;
                                const x = Math.sin(angle) * radius;
                                const y = -Math.cos(angle) * radius;
                                const isSelected = tempMinute === min;
                                const disabled = isMinuteDisabled();

                                return (
                                  <button
                                    key={min}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      setTempMinute(min);
                                      updateSelectedTime(tempHour24, min);
                                    }}
                                    style={{
                                      top: `calc(50% + ${y}px)`,
                                      left: `calc(50% + ${x}px)`,
                                      transform: "translate(-50%, -50%)",
                                    }}
                                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all z-10 ${
                                      disabled
                                        ? "text-slate-700 opacity-25 cursor-not-allowed pointer-events-none"
                                        : isSelected
                                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-110 cursor-pointer"
                                          : "text-slate-300 hover:bg-slate-800 cursor-pointer"
                                    }`}
                                  >
                                    {String(min).padStart(2, "0")}
                                  </button>
                                );
                              })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold block">
                        Meeting Purpose / Title
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g., Weekly Team Sync / Sprint Planning..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500 text-white transition"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isWeekend(bookingDate)||isSubmitting}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        isWeekend(bookingDate)
                          ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
