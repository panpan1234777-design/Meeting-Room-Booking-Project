"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "../../../context/AuthContext";

type Booking = {
  id: number;
  room: { name: string };
  user: { name: string };
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "confirmed" | "rejected";
};

export default function AdminBookingsPage() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "confirmed" | "rejected"
  >("all");

  const [search, setSearch] = useState("");

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/bookings", { token });

      setBookings(res.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchStatus =
        activeTab === "all" || booking.status === activeTab;

      const matchSearch =
        booking.user.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.room.name
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [bookings, activeTab, search]);

  const handleConfirm = async (id: number) => {
    setActingId(id);

    await apiFetch(`/bookings/${id}/confirm`, {
      method: "PUT",
      token,
    });

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? { ...booking, status: "confirmed" }
          : booking
      )
    );

    setActingId(null);
  };

  const handleReject = async (id: number) => {
    setActingId(id);

    await apiFetch(`/bookings/${id}/reject`, {
      method: "POST",
      token,
    });

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? { ...booking, status: "rejected" }
          : booking
      )
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this booking?")) return;

    setActingId(id);

    await apiFetch(`/bookings/${id}`, {
      method: "DELETE",
      token,
    });

    setBookings((prev) =>
      prev.filter((booking) => booking.id !== id)
    );

    setActingId(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h1 className="text-2xl font-bold text-white">
            All Bookings
          </h1>

          <p className="text-slate-400 text-sm">
            Manage every user's booking
          </p>
        </div>

        <input
          type="text"
          placeholder="Search user or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none text-L"
        />

      </div>

      <div className="flex gap-3 mb-6 text-sm">

        {["all", "pending", "confirmed", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2 rounded-full transition
            ${activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}

      </div>

      {/* ---------- TABLE START ---------- */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/70 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Room</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Purpose</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-slate-400"
                >
                  No bookings found.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-slate-700 hover:bg-slate-800/40 transition"
                >
                  <td className="px-4 py-4 font-medium text-white">
                    {b.room.name}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {b.user.name}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {new Date(b.booking_date).toISOString().split("T")[0]}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {b.start_time} - {b.end_time}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {b.purpose}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${b.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : b.status === "confirmed"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                        }`}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs">
                    <div className="flex justify-center gap-2">

                      {b.status === "pending" && (
                        <>
                          <button
                            disabled={actingId === b.id}
                            onClick={() => handleConfirm(b.id)}
                            className="rounded-lg bg-green-600 px-3 py-1 text-white hover:bg-green-500 disabled:opacity-50"
                          >
                            Confirm
                          </button>

                          <button
                            disabled={actingId === b.id}
                            onClick={() => handleReject(b.id)}
                            className="rounded-lg bg-yellow-600 px-3 py-1 text-white hover:bg-yellow-500 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        disabled={actingId === b.id}
                        onClick={() => handleDelete(b.id)}
                        className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

        <div className="text-sm text-slate-400">
          Showing
          <span className="mx-1 font-semibold text-white">
            {filteredBookings.length}
          </span>
          booking(s)
        </div>

        <button
          onClick={fetchBookings}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 transition"
        >
          Refresh
        </button>

      </div>

    </div>
  );
}