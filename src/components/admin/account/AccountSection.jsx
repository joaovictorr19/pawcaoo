import React from "react";
import { cn } from "@/lib/utils";

export default function AccountSection({ icon: Icon, title, description, action, className, children }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-900 leading-tight">{title}</h4>
            {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}