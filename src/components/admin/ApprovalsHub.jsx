import React, { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Hub compacto de aprovações.
 * Mantém filas separadas, mas mostra apenas a fila selecionada — evita
 * empilhar todas as filas abertas e o consequente crescimento da página.
 */
export default function ApprovalsHub({ queues }) {
  const [selectedKey, setSelectedKey] = useState(queues[0]?.key);
  const activeQueue = queues.find((q) => q.key === selectedKey) || queues[0];

  if (!queues?.length) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {queues.map((queue) => {
          const Icon = queue.icon;
          const isActive = queue.key === activeQueue.key;
          return (
            <button
              key={queue.key}
              type="button"
              onClick={() => setSelectedKey(queue.key)}
              aria-pressed={isActive}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/50"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">{queue.label}</span>
                <span className="block truncate text-[11px] text-slate-500">{queue.hint}</span>
              </span>
              {queue.count > 0 && (
                <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {queue.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-extrabold text-slate-900">{activeQueue.label}</h3>
          {activeQueue.count > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              {activeQueue.count} pendente{activeQueue.count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="p-4">{activeQueue.render()}</div>
      </div>
    </div>
  );
}