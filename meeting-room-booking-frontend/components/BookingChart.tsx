"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";

interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  room?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

interface BookingChartProps {
  bookings: Booking[];
  roomName: (id: number) => string;
}

type ChartRange = "today" | "week" | "year";

interface CategoryItem {
  id: string;
  label: string;
  tooltipTitle: string;
  isCurrent?: boolean;
  filter: (bookingDate: string) => boolean;
}

function dateOnly(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value).substring(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);

  return result;
}

function formatAxisDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getCategories(range: ChartRange): CategoryItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = dateOnly(today);

  if (range === "today") {
    return Array.from({ length: 7 }, (_, index) => {
      const d = addDays(today, index - 3);
      const str = dateOnly(d);
      const isToday = str === todayString;

      return {
        id: str,
        label: isToday ? "TODAY" : formatAxisDate(str),
        tooltipTitle: formatTooltipDate(str),
        isCurrent: isToday,
        filter: (bDate: string) => dateOnly(bDate) === str,
      };
    });
  }

  if (range === "week") {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + mondayOffset);

    return [-2, -1, 0, 1, 2].map((weekOffset) => {
      const weekMonday = new Date(currentMonday);
      weekMonday.setDate(currentMonday.getDate() + weekOffset * 7);
      const weekSunday = addDays(weekMonday, 6);

      const startStr = dateOnly(weekMonday);
      const endStr = dateOnly(weekSunday);

      let label = `${formatAxisDate(startStr)} - ${formatAxisDate(endStr)}`;
      if (weekOffset === 0) label = "This Week";
      else if (weekOffset === -1) label = "Last Week";
      else if (weekOffset === 1) label = "Next Week";
      else if (weekOffset === -2) label = "2 Weeks Ago";
      else if (weekOffset === 2) label = "In 2 Weeks";

      return {
        id: startStr,
        label,
        tooltipTitle: `Week of ${formatAxisDate(startStr)} - ${formatAxisDate(endStr)}`,
        isCurrent: weekOffset === 0,
        filter: (bDate: string) => {
          const dStr = dateOnly(bDate);
          return dStr >= startStr && dStr <= endStr;
        },
      };
    });
  }

  const year = today.getFullYear();
  const currentMonth = today.getMonth();

  return MONTH_NAMES.map((mName, mIndex) => {
    const monthStr = `${year}-${String(mIndex + 1).padStart(2, "0")}`;

    return {
      id: monthStr,
      label: mName,
      tooltipTitle: `${mName} ${year}`,
      isCurrent: mIndex === currentMonth,
      filter: (bDate: string) => dateOnly(bDate).startsWith(monthStr),
    };
  });
}

export default function BookingChart({
  bookings,
  roomName,
}: BookingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<ChartRange>("today");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = useMemo(() => {
    return getCategories(range);
  }, [range]);

  const roomNames = useMemo(() => {
    const names = new Set<string>();

    bookings.forEach((booking) => {
      const name = booking.room?.name || roomName(booking.room_id);
      names.add(name);
    });

    return Array.from(names);
  }, [bookings, roomName]);

  const series = useMemo(() => {
    return roomNames.map((name) => {
      const values = categories.map((cat) => {
        return bookings.filter((booking) => {
          const bookingRoom = booking.room?.name || roomName(booking.room_id);
          return bookingRoom === name && cat.filter(booking.booking_date);
        }).length;
      });

      return {
        name,
        type: "spline" as const,
        data: values,
        marker: {
          enabled: true,
          radius: 4,
          symbol: "circle",
        },
        lineWidth: 3,
        animation: {
          duration: 500,
        },
      };
    });
  }, [bookings, categories, roomNames, roomName]);

  const options: Highcharts.Options = {
    chart: {
      type: "spline",
      backgroundColor: "transparent",
      height: 360,
      spacing: [20, 18, 10, 18],
      style: {
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
    },

    title: {
      text: undefined,
    },

    credits: {
      enabled: false,
    },

    accessibility: {
      enabled: false,
    },

    legend: {
      enabled: true,
      align: "right",
      verticalAlign: "top",
      itemStyle: {
        color: "#cbd5e1",
        fontSize: "12px",
        fontWeight: "500",
      },
      itemHoverStyle: {
        color: "#ffffff",
      },
      symbolRadius: 5,
      itemDistance: 18,
    },

    xAxis: {
      categories: categories.map((c) => c.label),
      lineColor: "#1e293b",
      tickColor: "#1e293b",

      labels: {
        useHTML: true,
        style: {
          color: "#64748b",
          fontSize: "11px",
        },

        formatter: function () {
          const idx = typeof this.pos === "number" ? this.pos : 0;
          const cat = categories[idx];

          if (cat?.isCurrent) {
            return `
              <span style="color:#60a5fa; font-weight:700;">
                ${cat.label}
              </span>
            `;
          }

          return `
            <span style="color:#64748b">
              ${this.value}
            </span>
          `;
        },
      },
    },

    yAxis: {
      min: 0,
      allowDecimals: false,

      title: {
        text: "Bookings",
        style: {
          color: "#64748b",
          fontSize: "11px",
        },
      },

      labels: {
        style: {
          color: "#64748b",
          fontSize: "11px",
        },
      },

      gridLineColor: "#172033",
      gridLineDashStyle: "Dash",
    },

    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: "#0b1427",
      borderColor: "#263653",
      borderRadius: 12,
      shadow: {
        color: "rgba(0,0,0,0.45)",
        offsetX: 0,
        offsetY: 8,
        opacity: 0.3,
        width: 12,
      },
      formatter: function () {
        const index = typeof this.x === "number" ? this.x : 0;
        const cat = categories[index];

        let html = `
          <div style="min-width:150px; padding:4px;">
            <div style="color:#f8fafc; font-size:12px; font-weight:700; margin-bottom:10px;">
              ${cat?.tooltipTitle || ""}
            </div>
        `;

        this.points?.forEach((point) => {
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; margin-top:6px;">
              <span style="color:#cbd5e1; font-size:11px;">
                <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${point.color}; margin-right:6px;"></span>
                ${point.series.name}
              </span>

              <strong style="color:#f8fafc; font-size:12px;">
                ${point.y}
              </strong>
            </div>
          `;
        });

        html += `</div>`;

        return html;
      },
    },

    plotOptions: {
      spline: {
        marker: {
          enabled: true,
        },
      },

      series: {
        animation: {
          duration: 500,
        },

        states: {
          hover: {
            lineWidthPlus: 1,
          },
        },
      },
    },

    series,
  };

  useEffect(() => {
    if (!mounted || bookings.length === 0 || !chartRef.current) {
      return;
    }

    const chart = Highcharts.chart(chartRef.current, options);

    return () => chart.destroy();
  }, [bookings.length, mounted, options]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/65 shadow-xl shadow-black/10">
      {/* =====================================================
          CHART HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="m7 15 4-4 3 2 5-7" />
              <circle cx="11" cy="11" r="1" />
              <circle cx="14" cy="13" r="1" />
              <circle cx="19" cy="6" r="1" />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Booking Analytics
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Meeting room bookings for{" "}
              {range === "today"
                ? "the previous 3 days, today, and next 3 days"
                : range === "week"
                  ? "past 2 weeks, current week, and next 2 weeks"
                  : "January to December of current year"}
            </p>
          </div>
        </div>

        {/* RANGE SELECTOR */}

        <div className="flex w-fit rounded-xl border border-slate-800 bg-slate-950/70 p-1">
          <button
            type="button"
            onClick={() => setRange("today")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              range === "today"
                ? "bg-blue-500/15 text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setRange("week")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              range === "week"
                ? "bg-blue-500/15 text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Week
          </button>

          <button
            type="button"
            onClick={() => setRange("year")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              range === "year"
                ? "bg-blue-500/15 text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* =====================================================
          CHART
      ====================================================== */}

      <div className="px-2 pb-3 pt-2 sm:px-4">
        {mounted && bookings.length > 0 ? (
          <div ref={chartRef} />
        ) : (
          <div className="flex h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />

              <p className="text-sm text-slate-500">
                Loading booking analytics...
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
