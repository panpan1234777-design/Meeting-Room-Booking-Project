"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Example: [1, "...", 4, 5, 6, "...", 10]
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.ceil(totalItems / pageSize);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const btnBase =
    "flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition";

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-[11px] text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-300">
          {from}-{to}
        </span>{" "}
        of <span className="font-semibold text-slate-300">{totalItems}</span>
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={`${btnBase} border border-slate-800/60 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-slate-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`${btnBase} ${
                  page === currentPage
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={`${btnBase} border border-slate-800/60 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}