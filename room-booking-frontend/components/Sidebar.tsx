"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, DoorOpen, CalendarClock, LogOut, Calendar, Users } from "lucide-react";
import { useAuth } from "../app/context/AuthContext";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Bookings", href: "/booking", icon: CalendarClock },
  { label: "My Bookings", href: "/my-bookings", icon: CalendarClock },
];

const adminNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { label: "Bookings (all users)", href: "/admin/bookings", icon: CalendarClock },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"));
    }
  }, []);

  const { logout, user } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const itemsToShow = role === "admin" ? adminNavItems : navItems;

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-900 p-5">
      <div>
        <h1 className="mb-8 text-lg font-bold text-white">
          Meeting<span className="text-blue-500">RoomBooking</span>
        </h1>

        <nav className="space-y-1">
          {itemsToShow.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4">
        {user && (
          <p className="mb-3 truncate px-4 text-xs text-slate-500">
            {user.name}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}