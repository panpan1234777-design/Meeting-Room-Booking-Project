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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(todayStr);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Custom Calendar Dropdown State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(todayObj.getMonth());
  const [calendarYear, setCalendarYear] = useState(todayObj.getFullYear());

  // Clock Picker States
  const [activeTimeField, setActiveTimeField] = useState<
    "start" | "end" | null
  >(null);
  const [pickerMode, setPickerMode] = useState<"hour" | "minute">("hour");
  const [tempHour24, setTempHour24] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);
  const BASE_URL = "http://localhost:8000";

  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 17;

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
        timeDropdownRef.current &&
        !timeDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveTimeField(null);
      }
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

  const handleOpenBookForm = (room: Room) => {
    setSelectedRoom(room);
    setBookingDate(todayStr);
    setCalendarMonth(todayObj.getMonth());
    setCalendarYear(todayObj.getFullYear());
    setPurpose("");
    setErrorMessage("");
    setActiveTimeField(null);
    setIsCalendarOpen(false);

    if (room.today_slots && room.today_slots.length > 0) {
      const firstSlot = room.today_slots[0];
      const parts = firstSlot.split(" - ");
      if (parts.length === 2) {
        setStartTime(parts[0].slice(0, 5));
        setEndTime(parts[1].slice(0, 5));
      } else {
        setStartTime("09:00");
        setEndTime("17:00");
      }
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
    }

    setIsFormOpen(true);
  };

  const handleSelectSlotBadge = (slotStr: string) => {
    const parts = slotStr.split(" - ");
    if (parts.length === 2) {
      setStartTime(parts[0].slice(0, 5));
      setEndTime(parts[1].slice(0, 5));
      setErrorMessage("");
    }
  };

  const handleOpenTimePicker = (field: "start" | "end") => {
    const currentVal = field === "start" ? startTime : endTime;
    if (currentVal) {
      const [h, m] = currentVal.split(":").map(Number);
      setTempHour24(isNaN(h) ? 9 : h);
      setTempMinute(isNaN(m) ? 0 : m);
    } else {
      setTempHour24(field === "start" ? 9 : 10);
      setTempMinute(0);
    }
    setPickerMode("hour");
    setActiveTimeField(field);
  };

  const handleConfirmTime = () => {
    let targetHour = tempHour24;
    if (targetHour < WORK_START_HOUR) targetHour = WORK_START_HOUR;
    if (targetHour > WORK_END_HOUR) targetHour = WORK_END_HOUR;

    const formatted24 = `${String(targetHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`;

    if (activeTimeField === "start") {
      setStartTime(formatted24);
    } else if (activeTimeField === "end") {
      setEndTime(formatted24);
    }
    setActiveTimeField(null);
  };

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "-- : -- --";
    const [h24, m] = time24.split(":").map(Number);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    h12 = h12 === 0 ? 12 : h12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedRoom || !startTime || !endTime) {
      setErrorMessage("Please select both start and end times.");
      return;
    }

    const timeToMins = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const startMins = timeToMins(startTime);
    const endMins = timeToMins(endTime);
    const workStartMins = WORK_START_HOUR * 60;
    const workEndMins = WORK_END_HOUR * 60;

    if (startMins >= endMins) {
      setErrorMessage("End time must be later than start time.");
      return;
    }

    if (startMins < workStartMins || endMins > workEndMins) {
      setErrorMessage(
        "Bookings are only allowed during office hours (9:00 AM – 5:00 PM).",
      );
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          purpose: purpose,
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        router.push("/my-bookings");
      } else {
        const rawMsg = resData.message || "";
        if (rawMsg.toLowerCase().includes("validation") || !rawMsg) {
          setErrorMessage("This time slot overlaps with an existing booking");
        } else {
          setErrorMessage(rawMsg);
        }
      }
    } catch (error) {
      console.error("Booking Submit Error:", error);
      setErrorMessage(
        "Connection error. Please check your network and try again.",
      );
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading rooms and schedules...</p>
      </div>
    );
  }

  const clockHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const current12Hour = tempHour24 % 12 === 0 ? 12 : tempHour24 % 12;
  const isPM = tempHour24 >= 12;

  let handAngle = 0;
  if (pickerMode === "hour") {
    handAngle = (current12Hour % 12) * 30;
  } else {
    handAngle = (tempMinute / 60) * 360;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Book a Meeting Room
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Select a room below to schedule your meeting
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] px-2.5 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded-full font-medium tracking-wide">
                  MEETING ROOM
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/40">
                  {room.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{room.name}</h3>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 mb-4">
                <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{" "}
                  Available Today:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {room.today_slots && room.today_slots.length > 0 ? (
                    room.today_slots.map((slot, i) => (
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
                      No slots available today
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenBookForm(room)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-white" /> Book Room
            </button>
          </div>
        ))}
      </div>

      {isFormOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Modal Box - Increased sizing and font clarity */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl overflow-visible">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white transition cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-1 text-indigo-400 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" /> Book{" "}
              {selectedRoom.name}
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Office Hours: 9:00 AM – 5:00 PM
            </p>

            {errorMessage && (
              <div className="mb-3 p-2.5 bg-red-950/60 border border-red-500/60 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmitBooking}
              className="space-y-3.5 text-sm relative"
            >
              <div className="space-y-1.5 relative" ref={calendarDropdownRef}>
                <label className="text-xs text-slate-300 font-semibold block">
                  Select Date (1 Week Advance)
                </label>
                <div
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm flex items-center justify-between cursor-pointer hover:border-indigo-500 transition"
                >
                  <span className="font-mono">
                    {bookingDate.split("-").reverse().join("/")}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-white" />
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
                      {daysOfWeek.map((d) => (
                        <span
                          key={d}
                          className="text-[11px] font-semibold text-slate-500"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array.from({
                        length: getFirstDayOfMonth(calendarYear, calendarMonth),
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

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => {
                              setBookingDate(dateStr);
                              setIsCalendarOpen(false);
                            }}
                            className={`py-2 text-xs font-medium rounded-lg transition ${
                              isSelected
                                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40"
                                : isAllowed
                                  ? "text-slate-200 hover:bg-slate-800"
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

              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Available slots:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {selectedRoom.modal_slots &&
                  selectedRoom.modal_slots.length > 0 ? (
                    selectedRoom.modal_slots.map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSlotBadge(slot)}
                        className="text-xs font-mono bg-slate-900 hover:bg-indigo-600/20 text-slate-300 border border-slate-800 px-3 py-1 rounded-lg transition cursor-pointer"
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs font-mono bg-slate-900/50 text-slate-500 border border-slate-800/50 px-3 py-1 rounded-lg cursor-not-allowed">
                      No available slots for this date
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 relative">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold block">
                    Start Time
                  </label>
                  <div
                    onClick={() => handleOpenTimePicker("start")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white flex items-center justify-between cursor-pointer transition text-sm hover:border-indigo-500"
                  >
                    <span className="font-mono">
                      {formatDisplayTime(startTime)}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold block">
                    End Time
                  </label>
                  <div
                    onClick={() => handleOpenTimePicker("end")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white flex items-center justify-between cursor-pointer transition text-sm hover:border-indigo-500"
                  >
                    <span className="font-mono">
                      {formatDisplayTime(endTime)}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {activeTimeField && (
                  <div
                    ref={timeDropdownRef}
                    className="absolute top-16 left-0 right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95"
                  >
                    <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2.5">
                      Select {activeTimeField === "start" ? "Start" : "End"}{" "}
                      Time (9 AM - 5 PM)
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setPickerMode("hour")}
                        className={`text-xl font-extrabold px-3 py-1 rounded-lg transition ${
                          pickerMode === "hour"
                            ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500/50"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {String(current12Hour).padStart(2, "0")}
                      </button>
                      <span className="text-xl font-bold text-slate-500">
                        :
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerMode("minute")}
                        className={`text-xl font-extrabold px-3 py-1 rounded-lg transition ${
                          pickerMode === "minute"
                            ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500/50"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {String(tempMinute).padStart(2, "0")}
                      </button>

                      <div className="flex flex-col gap-1 ml-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPM) setTempHour24(tempHour24 - 12);
                          }}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                            !isPM
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isPM) setTempHour24(tempHour24 + 12);
                          }}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                            isPM
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center my-1.5">
                      <div className="relative w-36 h-36 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-inner">
                        <div
                          className="absolute w-0.5 bg-indigo-500 origin-bottom transition-all duration-200 z-0 pointer-events-none"
                          style={{
                            height: "45px",
                            bottom: "50%",
                            left: "calc(50% - 0.75px)",
                            transform: `rotate(${handAngle}deg)`,
                          }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full shadow-md shadow-indigo-500"></div>
                        </div>

                        <div className="w-2 h-2 bg-indigo-500 rounded-full absolute z-20 shadow-md"></div>

                        {pickerMode === "hour"
                          ? clockHours.map((hr, idx) => {
                              const angle = idx * 30 * (Math.PI / 180);
                              const radius = 45;
                              const x = Math.sin(angle) * radius;
                              const y = -Math.cos(angle) * radius;
                              const isSelected = current12Hour === hr;

                              return (
                                <button
                                  key={hr}
                                  type="button"
                                  onClick={() => {
                                    const isCurrentlyPM = tempHour24 >= 12;
                                    let newH = hr;
                                    if (isCurrentlyPM && hr !== 12) newH += 12;
                                    if (!isCurrentlyPM && hr === 12) newH = 0;
                                    setTempHour24(newH);
                                    setPickerMode("minute");
                                  }}
                                  style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                  }}
                                  className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-110"
                                      : "text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  {hr}
                                </button>
                              );
                            })
                          : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                              (min, idx) => {
                                const angle = idx * 30 * (Math.PI / 180);
                                const radius = 45;
                                const x = Math.sin(angle) * radius;
                                const y = -Math.cos(angle) * radius;
                                const isSelected = tempMinute === min;

                                return (
                                  <button
                                    key={min}
                                    type="button"
                                    onClick={() => setTempMinute(min)}
                                    style={{
                                      transform: `translate(${x}px, ${y}px)`,
                                    }}
                                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all z-10 cursor-pointer ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-110"
                                        : "text-slate-300 hover:bg-slate-800"
                                    }`}
                                  >
                                    {String(min).padStart(2, "0")}
                                  </button>
                                );
                              },
                            )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          setPickerMode(
                            pickerMode === "hour" ? "minute" : "hour",
                          )
                        }
                        className="text-xs text-indigo-400 hover:underline font-medium cursor-pointer"
                      >
                        Switch to {pickerMode === "hour" ? "Minutes" : "Hours"}
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTimeField(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white font-medium transition cursor-pointer"
                        >
                          CANCEL
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmTime}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">
                  Meeting Purpose
                </label>
                <textarea
                  required
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Project Discussion..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500 text-white"
                ></textarea>
              </div>

              <div className="flex gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
