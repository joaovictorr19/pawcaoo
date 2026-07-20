import React from "react";

const styles = [
  "bg-blue-50 text-blue-700", "bg-teal-50 text-teal-700",
  "bg-amber-50 text-amber-700", "bg-violet-50 text-violet-700",
];

export default function AdminStatCard({ stat, index }) {
  const Icon = stat.icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[index % styles.length]}`}><Icon className="h-5 w-5" /></div>
        <span className="text-3xl font-black tabular-nums text-slate-950">{stat.value}</span>
      </div>
      <p className="mt-5 text-sm font-bold text-slate-900">{stat.label}</p>
      <p className="mt-1 text-xs text-slate-600">{stat.subLabel}</p>
    </div>
  );
}