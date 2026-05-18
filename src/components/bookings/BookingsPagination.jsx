import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BookingsPagination({ totalPages, currentPage, setCurrentPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-slate-400">{currentPage} / {totalPages}</span>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}