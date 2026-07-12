"use client";
import { useState, useEffect } from "react";
import { CalendarDays, Clock, Building2, Loader2, AlertCircle, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
interface Booking {
    id: number;
    user_id: number;
    room: {
        name: string;
        location: string;
    };
    booking_date: string;
    start_time: string;
    end_time: string;
    purpose: string;
    status: "pending" | "approved" | "rejected";
}

export default function MyBookingsPage() {
    const { user: authUser } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

    const BASE_URL = "http://localhost:8000";

    useEffect(() => {
        const fetchAndFilterBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                const currentUserId = authUser?.id;

                const response = await fetch(`${BASE_URL}/api/bookings`, {
                    headers: {
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                const resData = await response.json();

                if (resData.status && currentUserId) {
                    const myFilteredBookings = resData.data.filter(
                        (b: any) => Number(b.user_id) === Number(currentUserId) 
                    );

                    myFilteredBookings.sort((a: any, b: any) => b.booking_date.localeCompare(a.booking_date));
                    setBookings(myFilteredBookings);
                }
            } catch (error) {
                console.error("Error filtering bookings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (authUser) { 
            fetchAndFilterBookings();
        }
    }, [authUser]);

    const filteredBookings = bookings.filter(b => {
        const currentStatus = b.status?.toLowerCase();

        if (activeTab === "pending") {
            return currentStatus === "pending" || !currentStatus;
        }
        if (activeTab === "approved") {
            return currentStatus === "approved" || currentStatus === "confirmed";
        }
        if (activeTab === "rejected") {
            return currentStatus === "rejected" || currentStatus === "failed";
        }
        return false;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950 text-xs">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                <p className="text-slate-400">Loading your bookings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen text-slate-200 text-xs">

            <div className="mb-5">
                <h1 className="text-xl font-bold tracking-tight text-white">My Bookings</h1>
                <p className="text-slate-500 text-[11px] mt-0.5">Track the status of your meeting room reservations.</p>
            </div>

            <div className="flex border-b border-slate-800/80 mb-5 gap-6 text-[11px] font-bold uppercase tracking-wider">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${activeTab === "pending" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                >
                    <Clock3 className="w-3.5 h-3.5" />
                    Pending ({bookings.filter(b => b.status?.toLowerCase() === "pending" || !b.status).length})
                </button>
                <button
                    onClick={() => setActiveTab("approved")}
                    className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${activeTab === "approved" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed ({bookings.filter(b => b.status?.toLowerCase() === "approved" || b.status?.toLowerCase() === "confirmed").length})
                </button>
                <button
                    onClick={() => setActiveTab("rejected")}
                    className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${activeTab === "rejected" ? "text-rose-400 border-b-2 border-rose-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected ({bookings.filter(b => b.status?.toLowerCase() === "rejected").length})
                </button>
            </div>

            {filteredBookings.length > 0 ? (
                <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/40 transition-colors">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2 rounded-lg border text-xs ${booking.status === "approved" ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" :
                                            booking.status === "rejected" ? "bg-rose-500/5 border-rose-500/10 text-rose-400" :
                                                "bg-amber-500/5 border-amber-500/10 text-amber-400"
                                        }`}>
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">{booking.room?.name || "Meeting Room"}</h3>
                                        <p className="text-[10px] text-slate-500">{booking.room?.location || "N/A"}</p>
                                    </div>
                                </div>

                                {/* 📅 Date & Time */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/40 w-fit">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>{booking.booking_date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>{booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 pl-1">
                                    <span className="text-slate-500 font-medium">Purpose:</span> {booking.purpose}
                                </p>
                            </div>

                            <div className="flex items-center sm:self-center self-end shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${booking.status?.toLowerCase() === "approved" || booking.status?.toLowerCase() === "confirmed"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        booking.status?.toLowerCase() === "rejected"
                                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                    {booking.status?.toLowerCase() === "approved" || booking.status?.toLowerCase() === "confirmed" ? "Confirmed" : booking.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-2xl p-10 bg-slate-900/10 text-center">
                    <AlertCircle className="w-7 h-7 text-slate-600 mb-2" />
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wide">No {activeTab === "approved" ? "Confirmed" : activeTab} Bookings</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">There are no records in this section at the moment.</p>
                </div>
            )}
        </div>
    );
}